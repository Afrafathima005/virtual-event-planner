import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getAuthUser } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const events = await db.collection("events").find({ "rsvps.userId": user.id }).sort({ date: 1 }).toArray()

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
      rsvpStatus: event.rsvps.find((rsvp: any) => rsvp.userId === user.id)?.status,
    }))

    return NextResponse.json(transformedEvents)
  } catch (error) {
    console.error("Error fetching RSVP events:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
