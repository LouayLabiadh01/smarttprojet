/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable import/order */
"use client"

import { useState, useEffect } from "react"
import { Plus, GitPullRequest, X } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog"
import { getQuicklinks, createQuicklink, deleteQuicklink } from "~/actions/quicklinks"
import { toast } from "~/actions/toast-setup"

type QuickLink = {
  id: string // UUID string
  title: string
  url: string
  created_at: string
  user: string // Required user field
}

export function QuicklinksSection() {
  const [links, setLinks] = useState<QuickLink[]>([])
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false)
  const [newLink, setNewLink] = useState({ title: "", url: "" })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchQuicklinks = async () => {
      setIsLoading(true)
      try {
        const data = await getQuicklinks()
        setLinks(data)
      } catch (error) {
        console.error("Failed to fetch quicklinks:", error)
        toast.error("Failed to load quicklinks. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuicklinks()
  }, [])

  const handleAddLink = async () => {
    if (newLink.title && newLink.url) {
      try {
        const createdLink = await createQuicklink(newLink)
        if (createdLink) {
          setLinks([...links, createdLink])
          setNewLink({ title: "", url: "" })
          setIsAddLinkOpen(false)
          toast.success("Quicklink added successfully")
        }
      } catch (error) {
        console.error("Failed to create quicklink:", error)
        toast.error("Failed to add quicklink. Please try again.")
      }
    }
  }

  const handleRemoveLink = async (id: string) => {
    try {
      const success = await deleteQuicklink(id)
      if (success) {
        setLinks(links.filter((link) => link.id !== id))
        toast.success("Quicklink removed successfully")
      }
    } catch (error) {
      console.error("Failed to delete quicklink:", error)
      toast.error("Failed to remove quicklink. Please try again.")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays < 1) {
      return "today"
    } else if (diffInDays === 1) {
      return "yesterday"
    } else if (diffInDays < 30) {
      return `${diffInDays} days ago`
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30)
      return `${months} ${months === 1 ? "month" : "months"} ago`
    } else {
      const years = Math.floor(diffInDays / 365)
      return `${years} ${years === 1 ? "year" : "years"} ago`
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg text-gray-400">Quicklinks</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-400 hover:bg-gray-800"
          onClick={() => setIsAddLinkOpen(true)}
        >
          <Plus size={16} className="mr-1" /> Add quick Link
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-2 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {links.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">No quicklinks yet. Add your first one!</div>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 rounded-md hover:bg-gray-800/50 transition-colors cursor-pointer group"
                onClick={() => window.open(link.url, "_blank")}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-800 rounded-md">
                    <GitPullRequest size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-300">{link.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(link.created_at)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveLink(link.id)
                  }}
                >
                  <X size={16} />
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      <Dialog open={isAddLinkOpen} onOpenChange={setIsAddLinkOpen}>
        <DialogContent className="bg-gray-900 text-gray-200 border-gray-800">
          <DialogHeader>
            <DialogTitle>Add Quick Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm text-gray-400">
                Title
              </label>
              <Input
                id="title"
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                placeholder="Link title"
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm text-gray-400">
                URL
              </label>
              <Input
                id="url"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="https://example.com"
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddLinkOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button onClick={handleAddLink} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
