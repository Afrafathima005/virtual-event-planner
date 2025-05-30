import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getAuthUser } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"
import { broadcastToEvent } from "../chat-stream/route"

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    // Check if the event exists
    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    })

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Get messages for this event
    const messages = await db.collection("messages").find({ eventId: id }).sort({ createdAt: 1 }).toArray()

    // Transform MongoDB _id to id for client
    const transformedMessages = messages.map((message) => ({
      id: message._id.toString(),
      eventId: message.eventId,
      userId: message.userId,
      userName: message.userName,
      content: message.content,
      createdAt: message.createdAt,
    }))

    return NextResponse.json(transformedMessages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid event ID" }, { status: 400 })
    }

    const { content } = await request.json()

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json({ message: "Message content is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if the event exists
    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    })

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Create message
    const message = {
      eventId: id,
      userId: user.id,
      userName: user.name,
      content: content.trim(),
      createdAt: new Date(),
    }

    const result = await db.collection("messages").insertOne(message)

    // Prepare the message for broadcasting
    const broadcastMessage = {
      id: result.insertedId.toString(),
      ...message,
    }

    // Broadcast the message to all connected clients
    broadcastToEvent(id, broadcastMessage)

    return NextResponse.json(broadcastMessage, { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
