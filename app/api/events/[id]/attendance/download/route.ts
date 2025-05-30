import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getAuthUser } from "@/lib/auth-utils"
import { ObjectId } from "mongodb"
import { Parser } from "json2csv"

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

    // Get the event to check permissions and get the title
    const event = await db.collection("events").findOne({ _id: new ObjectId(id) })

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    // Check if user is the owner or an admin
    if (event.createdBy !== user.id && user.role !== "admin") {
      return NextResponse.json({ message: "You don't have permission to download attendance" }, { status: 403 })
    }

    // Get attendance records
    const attendance = event.attendance || []

    // Format data for CSV
    const csvData = attendance.map((record: any) => ({
      Name: record.userName,
      Status: record.status,
      "Join Time": record.joinTime ? new Date(record.joinTime).toLocaleString() : "N/A",
      "Leave Time": record.leaveTime ? new Date(record.leaveTime).toLocaleString() : "N/A",
      "Duration (minutes)":
        record.joinTime && record.leaveTime
          ? Math.round((new Date(record.leaveTime).getTime() - new Date(record.joinTime).getTime()) / 60000)
          : "N/A",
    }))

    // Convert to CSV
    const fields = ["Name", "Status", "Join Time", "Leave Time", "Duration (minutes)"]
    const parser = new Parser({ fields })
    const csv = parser.parse(csvData)

    // Create filename based on event title and date
    const sanitizedTitle = event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    const filename = `attendance_${sanitizedTitle}_${new Date().toISOString().split("T")[0]}.csv`

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error generating attendance CSV:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
