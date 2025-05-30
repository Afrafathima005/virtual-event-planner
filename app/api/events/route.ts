import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getAuthUser } from "@/lib/auth-utils"

// GET all events
export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase()

    const events = await db.collection("events").find({}).toArray()

    // Transform MongoDB _id to id for client
    const transformedEvents = events.map((event) => ({
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      date: event.date,
      category: event.category,
      imageUrl: event.imageUrl,
      meetingLink: event.meetingLink,
      createdBy: event.createdBy,
    }))

    return NextResponse.json(transformedEvents)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST create a new event
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const eventData = await request.json()

    // Validate required fields
    const requiredFields = ["title", "description", "category", "date", "meetingLink"]
    for (const field of requiredFields) {
      if (!eventData[field]) {
        return NextResponse.json({ message: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("events").insertOne({
      ...eventData,
      createdBy: user.id,
      createdAt: new Date(),
      rsvps: [],
    })

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        ...eventData,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
