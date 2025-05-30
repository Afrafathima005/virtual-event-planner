"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { format, isPast, isFuture, isToday } from "date-fns"
import { Calendar, Clock, Download, ExternalLink, FileText, Loader2, MoreHorizontal, Plus, Users } from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MeetingResourceManager } from "@/components/meeting-resource-manager"
import { AttendanceTracker } from "@/components/attendance-tracker"
import { MeetingNotes } from "@/components/meeting-notes"

type Meeting = {
  id: string
  title: string
  date: string
  description: string
  category: string
  imageUrl: string
  meetingLink: string
  createdBy: string
  attendees: Array<{
    userId: string
    userName: string
    joinTime?: string
    leaveTime?: string
    status: "attending" | "maybe" | "declined" | "attended" | "missed"
  }>
  resources?: Array<{
    id: string
    name: string
    type: string
    url: string
    uploadedBy: string
    uploadedAt: string
  }>
  notes?: string
}

export default function MeetingDashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [activeTab, setActiveTab] = useState("upcoming")

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        // In a real implementation, this would fetch from a meetings API
        // For now, we'll use the events API and transform the data
        const response = await fetch("/api/events")
        if (!response.ok) {
          throw new Error("Failed to fetch meetings")
        }

        const data = await response.json()

        // Transform events to meetings format
        const transformedMeetings = data.map((event: any) => ({
          ...event,
          attendees: event.rsvps || [],
          resources: [],
          notes: "",
        }))

        setMeetings(transformedMeetings)
      } catch (error) {
        console.error("Error fetching meetings:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load meetings",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMeetings()
  }, [toast])

  const upcomingMeetings = meetings.filter(
    (meeting) => isFuture(new Date(meeting.date)) || isToday(new Date(meeting.date)),
  )

  const pastMeetings = meetings.filter((meeting) => isPast(new Date(meeting.date)) && !isToday(new Date(meeting.date)))

  const handleDownloadAttendance = (meetingId: string) => {
    // In a real implementation, this would generate and download a CSV file
    toast({
      title: "Attendance Report",
      description: "Attendance report downloaded successfully",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meeting Dashboard</h1>
          <p className="text-muted-foreground">Manage your meetings and track attendance</p>
        </div>
        <Button asChild className="mt-4 md:mt-0">
          <Link href="/events/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Meeting
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="upcoming">Upcoming Meetings</TabsTrigger>
          <TabsTrigger value="past">Past Meetings</TabsTrigger>
          {selectedMeeting && <TabsTrigger value="details">Meeting Details</TabsTrigger>}
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingMeetings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingMeetings.map((meeting) => (
                <Card key={meeting.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge className="mb-2">{meeting.category}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMeeting(meeting)
                              setActiveTab("details")
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/events/${meeting.id}`}>Go to Event Page</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="line-clamp-1">{meeting.title}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-1 h-3 w-3" />
                      {format(new Date(meeting.date), "EEEE, MMMM d, yyyy")}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {format(new Date(meeting.date), "h:mm a")}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm">{meeting.description}</p>
                    <div className="mt-4 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {meeting.attendees.filter((a) => a.status === "attending").length} attendees
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMeeting(meeting)
                        setActiveTab("details")
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Details
                    </Button>
                    {meeting.meetingLink && (
                      <Button asChild size="sm">
                        <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Join Now
                        </a>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No upcoming meetings</CardTitle>
                <CardDescription>You don't have any upcoming meetings.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Create a meeting to get started.</p>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href="/events/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Meeting
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastMeetings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastMeetings.map((meeting) => (
                <Card key={meeting.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="mb-2">
                        {meeting.category}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMeeting(meeting)
                              setActiveTab("details")
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadAttendance(meeting.id)}>
                            Download Attendance
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="line-clamp-1">{meeting.title}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-1 h-3 w-3" />
                      {format(new Date(meeting.date), "EEEE, MMMM d, yyyy")}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm">{meeting.description}</p>
                    <div className="mt-4 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {meeting.attendees.filter((a) => a.status === "attended").length} attended
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMeeting(meeting)
                        setActiveTab("details")
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Summary
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadAttendance(meeting.id)}>
                      <Download className="mr-2 h-4 w-4" />
                      Attendance
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No past meetings</CardTitle>
                <CardDescription>You don't have any past meetings.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Past meetings will appear here after they've occurred.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details">
          {selectedMeeting && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <Badge className="mb-2">{selectedMeeting.category}</Badge>
                        <CardTitle className="text-3xl">{selectedMeeting.title}</CardTitle>
                        <CardDescription className="flex items-center mt-2">
                          <Calendar className="mr-1 h-4 w-4" />
                          {format(new Date(selectedMeeting.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                        </CardDescription>
                      </div>
                      {selectedMeeting.meetingLink && (
                        <Button asChild>
                          <a href={selectedMeeting.meetingLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Join Meeting
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {selectedMeeting.imageUrl && (
                      <div className="aspect-video w-full overflow-hidden rounded-lg">
                        <img
                          src={selectedMeeting.imageUrl || "/placeholder.svg"}
                          alt={selectedMeeting.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold mb-2">About this meeting</h3>
                      <p className="whitespace-pre-line">{selectedMeeting.description}</p>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="attendees" className="mt-8">
                  <TabsList className="mb-4">
                    <TabsTrigger value="attendees">
                      <Users className="mr-2 h-4 w-4" />
                      Attendees
                    </TabsTrigger>
                    <TabsTrigger value="resources">
                      <FileText className="mr-2 h-4 w-4" />
                      Resources
                    </TabsTrigger>
                    <TabsTrigger value="notes">
                      <FileText className="mr-2 h-4 w-4" />
                      Meeting Notes
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="attendees">
                    <AttendanceTracker meeting={selectedMeeting} />
                  </TabsContent>

                  <TabsContent value="resources">
                    <MeetingResourceManager meeting={selectedMeeting} />
                  </TabsContent>

                  <TabsContent value="notes">
                    <MeetingNotes meeting={selectedMeeting} />
                  </TabsContent>
                </Tabs>
              </div>

              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Meeting Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Date and Time</h3>
                      <p>{format(new Date(selectedMeeting.date), "EEEE, MMMM d, yyyy")}</p>
                      <p>{format(new Date(selectedMeeting.date), "h:mm a")}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
                      <Badge variant="outline">{selectedMeeting.category}</Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Attendees</h3>
                      <p>
                        {
                          selectedMeeting.attendees.filter((a) => a.status === "attending" || a.status === "attended")
                            .length
                        }{" "}
                        attending
                      </p>
                    </div>
                    {selectedMeeting.meetingLink && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Meeting Link</h3>
                        <Button asChild variant="outline" className="w-full">
                          <a href={selectedMeeting.meetingLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Join Meeting
                          </a>
                        </Button>
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Actions</h3>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/events/${selectedMeeting.id}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            View Event Page
                          </Link>
                        </Button>
                        {isPast(new Date(selectedMeeting.date)) && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleDownloadAttendance(selectedMeeting.id)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Attendance
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
