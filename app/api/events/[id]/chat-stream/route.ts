import type { NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getAuthUser } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"

// Store active connections for each event
const eventConnections: Record<
  string,
  Set<{
    controller: ReadableStreamDefaultController
    userId: string
    userName: string
  }>
> = {}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const user = await getAuthUser(request)

  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  if (!ObjectId.isValid(id)) {
    return new Response("Invalid event ID", { status: 400 })
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get("userId") || user.id
  const userName = searchParams.get("userName") || user.name

  // Check if the event exists
  const { db } = await connectToDatabase()
  const event = await db.collection("events").findOne({
    _id: new ObjectId(id),
  })

  if (!event) {
    return new Response("Event not found", { status: 404 })
  }

  // Create a new response with the appropriate headers for SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // Initialize connections set for this event if it doesn't exist
      if (!eventConnections[id]) {
        eventConnections[id] = new Set()
      }

      // Add this connection to the set
      const connection = { controller, userId, userName }
      eventConnections[id].add(connection)

      // Send a connection established message
      const connectMessage = {
        type: "connection",
        message: "Connection established",
        timestamp: new Date().toISOString(),
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectMessage)}\n\n`))

      // Notify other users that this user joined
      const joinMessage = {
        type: "user-joined",
        userId,
        userName,
        timestamp: new Date().toISOString(),
      }
      broadcastToEvent(id, joinMessage, userId)

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        eventConnections[id].delete(connection)

        // Notify other users that this user left
        const leaveMessage = {
          type: "user-left",
          userId,
          userName,
          timestamp: new Date().toISOString(),
        }
        broadcastToEvent(id, leaveMessage, userId)

        // Clean up empty connection sets
        if (eventConnections[id].size === 0) {
          delete eventConnections[id]
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

// Function to broadcast a message to all connections for an event
export function broadcastToEvent(eventId: string, data: any, excludeUserId?: string) {
  const connections = eventConnections[eventId]
  if (!connections) return

  const encoder = new TextEncoder()
  const message = encoder.encode(`data: ${JSON.stringify(data)}\n\n`)

  for (const connection of connections) {
    // Skip the sender if excludeUserId is provided
    if (excludeUserId && connection.userId === excludeUserId) continue

    try {
      connection.controller.enqueue(message)
    } catch (error) {
      console.error("Error broadcasting message:", error)
    }
  }
}
