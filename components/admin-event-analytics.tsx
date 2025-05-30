"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, XAxis, YAxis, Bar, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"

type Event = {
  id: string
  title: string
  date: string
  category: string
  createdBy: string
  createdAt: string
  rsvpCount: number
}

export function AdminEventAnalytics({ events }: { events: Event[] }) {
  // Calculate events by category
  const eventsByCategory = events.reduce((acc: Record<string, number>, event) => {
    acc[event.category] = (acc[event.category] || 0) + 1
    return acc
  }, {})

  const categoryData = Object.entries(eventsByCategory).map(([name, value]) => ({
    name,
    value,
  }))

  // Calculate RSVPs by category
  const rsvpsByCategory = events.reduce((acc: Record<string, number>, event) => {
    acc[event.category] = (acc[event.category] || 0) + event.rsvpCount
    return acc
  }, {})

  const rsvpCategoryData = Object.entries(rsvpsByCategory).map(([name, value]) => ({
    name,
    value,
  }))

  // Calculate events by month
  const eventsByMonth = events.reduce((acc: Record<string, number>, event) => {
    const month = new Date(event.date).toLocaleString("default", { month: "short" })
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {})

  const monthData = Object.entries(eventsByMonth).map(([name, value]) => ({
    name,
    Events: value,
  }))

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Events by Category</CardTitle>
          <CardDescription>Distribution of events across different categories</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Category</span>
                            <span className="font-bold text-muted-foreground">{payload[0].name}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Events</span>
                            <span className="font-bold">{payload[0].value}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>RSVPs by Category</CardTitle>
          <CardDescription>Total RSVPs received per category</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rsvpCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {rsvpCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Category</span>
                            <span className="font-bold text-muted-foreground">{payload[0].name}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">RSVPs</span>
                            <span className="font-bold">{payload[0].value}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Events by Month</CardTitle>
          <CardDescription>Number of events scheduled per month</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ChartContainer>
            <BarChart data={monthData}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Bar dataKey="Events" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
              <ChartTooltip content={<ChartTooltipContent className="bg-background" valueSuffix="" />} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
