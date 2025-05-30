import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getAuthUser } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const events = await db.collection("events").find({}).sort({ date: -1 }).toArray()

    // Transform MongoDB _id to id for client
    const transformedEvents = events.map((event) => ({
      id: event._id.toString(),
      title: event.title,
      date: event.date,
      category: event.category,
      createdBy: event.createdBy,
      createdAt: event.createdAt,
      rsvpCount: event.rsvps?.filter((rsvp: any) => rsvp.status === "attending").length || 0,
    }))

    return NextResponse.json(transformedEvents)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
