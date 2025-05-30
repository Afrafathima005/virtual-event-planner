"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Calendar, Edit, ExternalLink, MoreVertical, Trash, Users } from "lucide-react"

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

type EventCardProps = {
  event: Event
  isOwner: boolean
}

export function EventCard({ event, isOwner }: EventCardProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete event")
      }

      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully",
      })

      // Refresh the page or update the UI
      window.location.reload()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the event",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleJoinMeeting = async () => {
    if (!user) return

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

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardHeader className="relative p-0">
        <div className="absolute right-4 top-4 z-10">
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="bg-background/80 backdrop-blur-sm">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/events/edit/${event.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={event.imageUrl || `/placeholder.svg?height=200&width=400&text=${encodeURIComponent(event.title)}`}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {event.category}
          </Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-1 h-3 w-3" />
            {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
          </div>
        </div>
        <CardTitle className="line-clamp-1 mb-2 text-xl">{event.title}</CardTitle>
        <CardDescription className="line-clamp-2 mb-4">{event.description}</CardDescription>
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <Calendar className="mr-1 h-4 w-4" />
          {new Date(event.date).toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between p-6 pt-0">
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href={`/events/${event.id}`}>
            <Users className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
        {event.meetingLink && (
          <Button size="sm" className="rounded-full" onClick={handleJoinMeeting}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Join Now
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
