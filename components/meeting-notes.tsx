"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Download, FileText, Save } from "lucide-react"

type Meeting = {
  id: string
  title: string
  notes?: string
}

export function MeetingNotes({ meeting }: { meeting: Meeting }) {
  const { toast } = useToast()
  const [notes, setNotes] = useState(meeting.notes || "")
  const [saving, setSaving] = useState(false)

  const handleSaveNotes = async () => {
    setSaving(true)
    try {
      // In a real implementation, this would save to the database
      // For now, we'll just simulate a successful save
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Notes saved",
        description: "Your meeting notes have been saved successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save meeting notes",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadNotes = () => {
    // Create a blob with the notes content
    const blob = new Blob([notes], { type: "text/plain" })

    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = `${meeting.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_notes.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Meeting Notes
        </CardTitle>
        <CardDescription>Take notes during your meeting and save them for later reference</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Type your meeting notes here..."
          className="min-h-[200px] resize-none"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleDownloadNotes} disabled={!notes.trim()}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button onClick={handleSaveNotes} disabled={saving}>
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Notes
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
