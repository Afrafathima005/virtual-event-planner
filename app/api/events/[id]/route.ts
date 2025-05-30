import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getAuthUser } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"

// GET a specific event
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid event ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    })

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Transform MongoDB _id to id for client
    const transformedEvent = {
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      date: event.date,
      category: event.category,
      imageUrl: event.imageUrl,
      meetingLink: event.meetingLink,
      createdBy: event.createdBy,
      rsvps: event.rsvps || [],
    }

    return NextResponse.json(transformedEvent)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// PUT update an event
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid event ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if the event exists and belongs to the user
    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    })

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Check if the user is the owner or an admin
    if (event.createdBy !== user.id && user.role !== "admin") {
      return NextResponse.json({ message: "You don't have permission to update this event" }, { status: 403 })
    }

    const updateData = await request.json()

    // Remove fields that shouldn't be updated
    delete updateData.id
    delete updateData.createdBy
    delete updateData.createdAt
    delete updateData.rsvps

    const result = await db
      .collection("events")
      .updateOne({ _id: new ObjectId(id) }, { $set: { ...updateData, updatedAt: new Date() } })

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Event updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE an event
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid event ID" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if the event exists and belongs to the user
    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    })

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Check if the user is the owner or an admin
    if (event.createdBy !== user.id && user.role !== "admin") {
      return NextResponse.json({ message: "You don't have permission to delete this event" }, { status: 403 })
    }

    const result = await db.collection("events").deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Event deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
