"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Download, File, FileText, Link2, Plus, Upload, X } from "lucide-react"

type Resource = {
  id: string
  name: string
  type: string
  url: string
  uploadedBy: string
  uploadedAt: string
}

type Meeting = {
  id: string
  title: string
  resources?: Resource[]
}

export function MeetingResourceManager({ meeting }: { meeting: Meeting }) {
  const { toast } = useToast()
  const [resources, setResources] = useState<Resource[]>(meeting.resources || [])
  const [showAddResource, setShowAddResource] = useState(false)
  const [resourceName, setResourceName] = useState("")
  const [resourceUrl, setResourceUrl] = useState("")
  const [resourceType, setResourceType] = useState("link")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddResource = async () => {
    if (!resourceName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a resource name",
      })
      return
    }

    if (resourceType === "link" && !resourceUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid URL",
      })
      return
    }

    if (resourceType === "file" && !fileInputRef.current?.files?.length) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file to upload",
      })
      return
    }

    setUploading(true)
    try {
      // In a real implementation, this would upload the file or save the link
      // For now, we'll just simulate a successful upload
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newResource: Resource = {
        id: Date.now().toString(),
        name: resourceName,
        type: resourceType,
        url: resourceType === "link" ? resourceUrl : `#file-${Date.now()}`,
        uploadedBy: "Current User",
        uploadedAt: new Date().toISOString(),
      }

      setResources([...resources, newResource])
      setResourceName("")
      setResourceUrl("")
      setShowAddResource(false)

      toast({
        title: "Resource added",
        description: "Your resource has been added successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add resource",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveResource = (id: string) => {
    setResources(resources.filter((resource) => resource.id !== id))
    toast({
      title: "Resource removed",
      description: "The resource has been removed",
    })
  }

  const getResourceIcon = (type: string) => {
    if (type === "link") return <Link2 className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Meeting Resources
          </CardTitle>
          <Button size="sm" onClick={() => setShowAddResource(!showAddResource)}>
            {showAddResource ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span className="ml-2">{showAddResource ? "Cancel" : "Add Resource"}</span>
          </Button>
        </div>
        <CardDescription>Add and manage resources for this meeting</CardDescription>
      </CardHeader>
      <CardContent>
        {showAddResource && (
          <div className="space-y-4 mb-6 p-4 border rounded-md">
            <div className="space-y-2">
              <Label htmlFor="resource-name">Resource Name</Label>
              <Input
                id="resource-name"
                placeholder="Enter resource name"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="resource-type-link"
                  name="resource-type"
                  value="link"
                  checked={resourceType === "link"}
                  onChange={() => setResourceType("link")}
                  className="mr-2"
                />
                <Label htmlFor="resource-type-link">Link</Label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="resource-type-file"
                  name="resource-type"
                  value="file"
                  checked={resourceType === "file"}
                  onChange={() => setResourceType("file")}
                  className="mr-2"
                />
                <Label htmlFor="resource-type-file">File</Label>
              </div>
            </div>

            {resourceType === "link" ? (
              <div className="space-y-2">
                <Label htmlFor="resource-url">URL</Label>
                <Input
                  id="resource-url"
                  placeholder="Enter resource URL"
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="resource-file">File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    id="resource-file"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setResourceName(e.target.files[0].name)
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {fileInputRef.current?.files?.[0]?.name || "No file chosen"}
                  </span>
                </div>
              </div>
            )}

            <Button onClick={handleAddResource} disabled={uploading}>
              {uploading ? "Adding..." : "Add Resource"}
            </Button>
          </div>
        )}

        {resources.length > 0 ? (
          <div className="space-y-4">
            {resources.map((resource) => (
              <div key={resource.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center">
                  {getResourceIcon(resource.type)}
                  <div className="ml-3">
                    <p className="font-medium">{resource.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(resource.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRemoveResource(resource.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No resources yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add resources like documents, presentations, or links for this meeting
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
