import type React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CalendarDays, Users, MessageSquare, BarChart3 } from "lucide-react"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="py-12 md:py-24 lg:py-32 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">Virtual Event Planning Made Simple</h1>
        <p className="text-xl text-muted-foreground max-w-[800px] mb-8">
          Create, manage, and attend virtual events with ease. Connect with others in real-time and make your virtual
          gatherings memorable.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/events">Browse Events</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-24">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need for Virtual Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<CalendarDays className="h-10 w-10" />}
            title="Event Management"
            description="Create and manage your virtual events with all the details you need."
          />
          <FeatureCard
            icon={<Users className="h-10 w-10" />}
            title="RSVP System"
            description="Track who's attending your events with our simple RSVP system."
          />
          <FeatureCard
            icon={<MessageSquare className="h-10 w-10" />}
            title="Real-time Chat"
            description="Connect with attendees in real-time during your events."
          />
          <FeatureCard
            icon={<BarChart3 className="h-10 w-10" />}
            title="Event Analytics"
            description="Get insights into your events with detailed analytics."
          />
        </div>
      </section>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 border rounded-lg">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
