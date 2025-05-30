import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getAuthUser } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"

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

    const { status } = await request.json()

    if (!["attending", "maybe", "declined"].includes(status)) {
      return NextResponse.json({ message: "Invalid RSVP status" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if the event exists
    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    })

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Check if user already RSVP'd
    const existingRsvpIndex = event.rsvps?.findIndex((rsvp: any) => rsvp.userId === user.id)

    let result

    if (existingRsvpIndex >= 0) {
      // Update existing RSVP
      result = await db.collection("events").updateOne(
        { _id: new ObjectId(id), "rsvps.userId": user.id },
        {
          $set: {
            "rsvps.$.status": status,
            "rsvps.$.updatedAt": new Date(),
          },
        },
      )
    } else {
      // Add new RSVP
      result = await db.collection("events").updateOne(
        { _id: new ObjectId(id) },
        {
          $push: {
            rsvps: {
              userId: user.id,
              userName: user.name,
              status,
              createdAt: new Date(),
            },
          },
        },
      )
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "RSVP updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating RSVP:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
