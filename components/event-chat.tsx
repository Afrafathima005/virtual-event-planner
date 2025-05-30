"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type Message = {
  id: string
  eventId: string
  userId: string
  userName: string
  content: string
  createdAt: string
}

export function EventChat({ eventId }: { eventId: string }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // Load previous messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/messages`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data)
        }
      } catch (error) {
        console.error("Error fetching messages:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()

    // Set up SSE connection for real-time updates
    if (user) {
      const eventSource = new EventSource(`/api/events/${eventId}/chat-stream?userId=${user.id}&userName=${user.name}`)

      eventSource.onmessage = (event) => {
        const message = JSON.parse(event.data)
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          if (!prev.some((m) => m.id === message.id)) {
            return [...prev, message]
          }
          return prev
        })
      }

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error)
        eventSource.close()
      }

      eventSourceRef.current = eventSource
    }

    // Clean up on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [eventId, user])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    setSending(true)
    try {
      const response = await fetch(`/api/events/${eventId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      // Clear input
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[500px]">
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Be the first to say hello!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.userId === user?.id ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex ${
                    message.userId === user?.id ? "flex-row-reverse" : "flex-row"
                  } items-start gap-2 max-w-[80%]`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{message.userName?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div
                      className={`px-3 py-2 rounded-lg ${
                        message.userId === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div
                      className={`flex text-xs text-muted-foreground mt-1 ${
                        message.userId === user?.id ? "justify-end" : ""
                      }`}
                    >
                      <span className="mr-2">{message.userName || "Anonymous"}</span>
                      <span>
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="border-t p-4 flex items-center gap-2">
        <Input
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
