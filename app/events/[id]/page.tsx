"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { Calendar, Clock, Edit, ExternalLink, Loader2, MapPin, Share2, Users } from "lucide-react"
import { AttendanceTracker } from "@/components/attendance-tracker"

type Event = {
  id: string
  title: string
  description: string
  date: string
  category: string
  imageUrl: string
  meetingLink: string
  createdBy: string
  rsvps: Array<{
    userId: string
    userName: string
    status: string
  }>
}

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch event")
        }

        const data = await response.json()
        setEvent(data)

        // Check if user has RSVP'd
        if (user) {
          const userRsvp = data.rsvps.find((rsvp: any) => rsvp.userId === user.id)
          if (userRsvp) {
            setRsvpStatus(userRsvp.status)
          }
        }
      } catch (error) {
        console.error("Error fetching event:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load event details",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchEvent()
    }
  }, [params.id, user, toast])

  const handleRSVP = async (status: string) => {
    if (!user) {
      router.push("/login")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/events/${event?.id}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update RSVP")
      }

      setRsvpStatus(status)
      toast({
        title: "RSVP updated",
        description: `You are now ${status} this event`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update your RSVP",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoinMeeting = async () => {
    if (!user || !event) return

    try {
      // Record attendance when joining
      await fetch(`/api/events/${event.id}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "join",
          timestamp: new Date().toISOString(),
        }),
      })

      // Open the meeting link in a new tab
      window.open(event.meetingLink, "_blank")
    } catch (error) {
      console.error("Error recording attendance:", error)
    }
  }

  const handleShareEvent = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: event?.description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Event link copied to clipboard",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Event not found</CardTitle>
            <CardDescription>The event you're looking for doesn't exist or has been removed.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/events")}>Back to Events</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const isOwner = user && user.id === event.createdBy
  const isPastEvent = new Date(event.date) < new Date()

  return (
    <div className="container mx-auto py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <Badge className="mb-2">{event.category}</Badge>
              <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                </div>
                <div className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {format(new Date(event.date), "h:mm a")}
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  Virtual Event
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isOwner && (
                <Button variant="outline" asChild>
                  <a href={`/events/edit/${event.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={handleShareEvent}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          {event.imageUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
              <img
                src={event.imageUrl || "/placeholder.svg"}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>About this event</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none dark:prose-invert">
                <p className="whitespace-pre-line">{event.description}</p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="attendees">
            <TabsList className="mb-4">
              <TabsTrigger value="attendees">
                <Users className="mr-2 h-4 w-4" />
                Attendees ({event.rsvps.filter((rsvp) => rsvp.status === "attending").length})
              </TabsTrigger>
              {(isOwner || (user && user.role === "admin")) && isPastEvent && (
                <TabsTrigger value="attendance">
                  <Users className="mr-2 h-4 w-4" />
                  Attendance
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="attendees">
              <Card>
                <CardHeader>
                  <CardTitle>Who's attending</CardTitle>
                  <CardDescription>People who have RSVP'd to this event</CardDescription>
                </CardHeader>
                <CardContent>
                  {event.rsvps.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {event.rsvps
                        .filter((rsvp) => rsvp.status === "attending")
                        .map((rsvp) => (
                          <div key={rsvp.userId} className="flex items-center gap-2 p-2 rounded-md border">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                              {rsvp.userName.charAt(0).toUpperCase()}
                            </div>
                            <span>{rsvp.userName}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No one has RSVP'd yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {(isOwner || (user && user.role === "admin")) && isPastEvent && (
              <TabsContent value="attendance">
                <AttendanceTracker meeting={event} />
              </TabsContent>
            )}
          </Tabs>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Join this event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isPastEvent ? (
                <>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleRSVP("attending")}
                      disabled={isSubmitting || rsvpStatus === "attending"}
                      className={rsvpStatus === "attending" ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {rsvpStatus === "attending" ? "You're attending" : "Attend"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRSVP("maybe")}
                      disabled={isSubmitting || rsvpStatus === "maybe"}
                      className={rsvpStatus === "maybe" ? "border-yellow-500 text-yellow-500" : ""}
                    >
                      {rsvpStatus === "maybe" ? "You might attend" : "Maybe"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRSVP("declined")}
                      disabled={isSubmitting || rsvpStatus === "declined"}
                      className={rsvpStatus === "declined" ? "border-red-500 text-red-500" : ""}
                    >
                      {rsvpStatus === "declined" ? "You declined" : "Decline"}
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Meeting details</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Join the virtual meeting by clicking the button below at the scheduled time.
                    </p>
                    <Button className="w-full" onClick={handleJoinMeeting}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Join Now
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">This event has already taken place.</p>
                  {event.meetingLink && (
                    <Button variant="outline" className="w-full" onClick={handleJoinMeeting}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Recording
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2 border-t pt-6">
              <div>
                <h3 className="font-medium">Date and time</h3>
                <p className="text-sm text-muted-foreground">{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(event.date), "h:mm a")}</p>
              </div>
              <div className="mt-2">
                <h3 className="font-medium">Location</h3>
                <p className="text-sm text-muted-foreground">Virtual Event</p>
              </div>
              <div className="mt-2">
                <h3 className="font-medium">Attendees</h3>
                <p className="text-sm text-muted-foreground">
                  {event.rsvps.filter((rsvp) => rsvp.status === "attending").length} attending
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
