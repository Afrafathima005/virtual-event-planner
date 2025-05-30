"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Loader2, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type Attendee = {
  userId: string
  userName: string
  status: "attending" | "attended" | "maybe" | "declined" | "missed"
  joinTime?: string
  leaveTime?: string
}

type Meeting = {
  id: string
  title: string
  attendance?: Attendee[]
}

export function AttendanceTracker({ meeting }: { meeting: Meeting }) {
  const { toast } = useToast()
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch(`/api/events/${meeting.id}/attendance`)
        if (!response.ok) {
          throw new Error("Failed to fetch attendance")
        }
        const data = await response.json()
        setAttendees(data)
      } catch (error) {
        console.error("Error fetching attendance:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load attendance data",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()
  }, [meeting.id, toast])

  const handleDownloadAttendance = async () => {
    try {
      const response = await fetch(`/api/events/${meeting.id}/attendance/download`)
      if (!response.ok) {
        throw new Error("Failed to download attendance")
      }

      // Create a blob from the response
      const blob = await response.blob()

      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `attendance_${meeting.id}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading attendance:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download attendance report",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "attending":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Attending
          </Badge>
        )
      case "attended":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Attended
          </Badge>
        )
      case "maybe":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Maybe
          </Badge>
        )
      case "declined":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Declined
          </Badge>
        )
      case "missed":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            Missed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const calculateDuration = (joinTime?: string, leaveTime?: string) => {
    if (!joinTime || !leaveTime) return "N/A"

    const start = new Date(joinTime).getTime()
    const end = new Date(leaveTime).getTime()
    const durationMs = end - start

    if (durationMs < 0) return "N/A"

    const minutes = Math.floor(durationMs / 60000)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Attendance
          </CardTitle>
          <CardDescription>
            {attendees.length} {attendees.length === 1 ? "person" : "people"} in this meeting
          </CardDescription>
        </div>
        <Button variant="outline" onClick={handleDownloadAttendance}>
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </CardHeader>
      <CardContent>
        {attendees.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Time</TableHead>
                  <TableHead>Leave Time</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendees.map((attendee) => (
                  <TableRow key={attendee.userId}>
                    <TableCell className="font-medium">{attendee.userName}</TableCell>
                    <TableCell>{getStatusBadge(attendee.status)}</TableCell>
                    <TableCell>{attendee.joinTime ? new Date(attendee.joinTime).toLocaleString() : "N/A"}</TableCell>
                    <TableCell>{attendee.leaveTime ? new Date(attendee.leaveTime).toLocaleString() : "N/A"}</TableCell>
                    <TableCell>{calculateDuration(attendee.joinTime, attendee.leaveTime)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No attendance data yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Attendance will be recorded when participants join the meeting
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
