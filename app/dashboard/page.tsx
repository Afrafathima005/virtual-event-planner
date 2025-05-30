"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventCard } from "@/components/event-card"
import { useToast } from "@/components/ui/use-toast"
import { CalendarDays, Loader2, Plus, Users } from "lucide-react"

type Event = {
  id: string
  title: string
  date: string
  description: string
  category: string
  imageUrl: string
  meetingLink: string
  createdBy: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch all events
        const eventsResponse = await fetch("/api/events")
        if (!eventsResponse.ok) {
          throw new Error("Failed to fetch events")
        }
        const eventsData = await eventsResponse.json()
        setEvents(eventsData)

        // Fetch user's events
        const myEventsResponse = await fetch("/api/events/my-events")
        if (!myEventsResponse.ok) {
          throw new Error("Failed to fetch my events")
        }
        const myEventsData = await myEventsResponse.json()
        setMyEvents(myEventsData)
      } catch (error) {
        console.error("Error fetching events:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load events",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [toast])

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Sort events by date (newest first)
  const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const sortedMyEvents = [...myEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Filter upcoming events (today or in the future)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingEvents = sortedEvents.filter((event) => new Date(event.date) >= today)
  const upcomingMyEvents = sortedMyEvents.filter((event) => new Date(event.date) >= today)

  return (
    <div className="container mx-auto py-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <Button asChild className="mt-4 md:mt-0">
          <Link href="/events/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">{upcomingEvents.length} upcoming events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Events</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myEvents.length}</div>
            <p className="text-xs text-muted-foreground">{upcomingMyEvents.length} upcoming events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link href="/events/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link href="/events">
                <CalendarDays className="mr-2 h-4 w-4" />
                Browse Events
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="my-events">My Events</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} isOwner={event.createdBy === user?.id} />
              ))
            ) : (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>No upcoming events</CardTitle>
                  <CardDescription>There are no upcoming events at the moment.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Check back later or create your own event.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-events" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMyEvents.length > 0 ? (
              sortedMyEvents.map((event) => <EventCard key={event.id} event={event} isOwner={true} />)
            ) : (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>No events created</CardTitle>
                  <CardDescription>You haven't created any events yet.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">Create your first event to get started.</p>
                  <Button asChild>
                    <Link href="/events/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Event
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
