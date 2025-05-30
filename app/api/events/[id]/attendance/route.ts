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

    const { action, timestamp } = await request.json()

    if (!["join", "leave"].includes(action)) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if the event exists
    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    })

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Check if user already has an attendance record
    const attendanceRecord = event.attendance?.find((record: any) => record.userId === user.id)

    let result

    if (attendanceRecord) {
      // Update existing attendance record
      const updateData: any = {}

      if (action === "join") {
        updateData["attendance.$.joinTime"] = timestamp
        updateData["attendance.$.status"] = "attending"
      } else if (action === "leave") {
        updateData["attendance.$.leaveTime"] = timestamp
        updateData["attendance.$.status"] = "attended"
      }

      result = await db
        .collection("events")
        .updateOne({ _id: new ObjectId(id), "attendance.userId": user.id }, { $set: updateData })
    } else {
      // Add new attendance record
      const attendanceData: any = {
        userId: user.id,
        userName: user.name,
        status: action === "join" ? "attending" : "missed",
      }

      if (action === "join") {
        attendanceData.joinTime = timestamp
      } else if (action === "leave") {
        attendanceData.leaveTime = timestamp
      }

      result = await db.collection("events").updateOne(
        { _id: new ObjectId(id) },
        {
          $push: {
            attendance: attendanceData,
          },
        },
      )
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Attendance recorded successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error recording attendance:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// GET attendance records for an event
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

    const event = await db.collection("events").findOne({ _id: new ObjectId(id) }, { projection: { attendance: 1 } })

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Check if user is the owner or an admin
    const fullEvent = await db.collection("events").findOne({ _id: new ObjectId(id) })
    if (fullEvent.createdBy !== user.id && user.role !== "admin") {
      return NextResponse.json({ message: "You don't have permission to view attendance" }, { status: 403 })
    }

    return NextResponse.json(event.attendance || [])
  } catch (error) {
    console.error("Error fetching attendance:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
