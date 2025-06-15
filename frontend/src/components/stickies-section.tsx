/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable import/order */
"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Plus, Search, Smile, Bold, Italic, List, Trash, X } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import {
  getStickies,
  createSticky,
  updateSticky,
  deleteSticky,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "~/actions/stickies"
import { toast } from "~/actions/toast-setup"

type ChecklistItem = {
  id: string // UUID string
  text: string
  checked: boolean
  user: string // Required user field
}

type Sticky = {
  id: string // UUID string
  title: string
  content: string
  color: string
  type: "note" | "checklist"
  created_at: string
  user: string // Required user field
  items?: ChecklistItem[]
}

const COLORS = [
  "#483D6B", // Purple
  "#6D3D4B", // Maroon
  "#3D6B48", // Green
  "#6B5A3D", // Brown
  "#3D4B6D", // Blue
]

const EMOJIS = ["😀", "👍", "🎉", "❤️", "🔥", "✅", "⭐", "🚀", "💡", "📝"]

export function StickiesSection() {
  const [stickies, setStickies] = useState<Sticky[]>([])
  const [isAddStickyOpen, setIsAddStickyOpen] = useState(false)
  const [newSticky, setNewSticky] = useState<Omit<Sticky, "id" | "created_at" | "user">>({
    title: "",
    content: "",
    color: COLORS[0] ?? "",
    type: "note",
    items: [],
  })
  const [editingField, setEditingField] = useState<{ stickyId: string; field: string } | null>(null)
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [addingItemToSticky, setAddingItemToSticky] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStickies = async () => {
      setIsLoading(true)
      try {
        const data = await getStickies()
        setStickies(data)
      } catch (error) {
        console.error("Failed to fetch stickies:", error)
        toast.error("Failed to load stickies. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStickies()
  }, [])

  const handleAddSticky = async () => {
    if (newSticky.type === "note" && !newSticky.content) return
    if (newSticky.type === "checklist" && (!newSticky.items || newSticky.items.length === 0)) return

    try {
      // Create the sticky without items first
      const stickyToCreate = {
        ...newSticky,
        items: undefined, // Don't send items with sticky creation
      }

      const createdSticky = await createSticky(stickyToCreate)
      if (createdSticky) {
        // If it's a checklist with items, add them one by one
        if (newSticky.type === "checklist" && newSticky.items && newSticky.items.length > 0) {
          const createdItems: ChecklistItem[] = []

          // Add each item to the created sticky
          for (const item of newSticky.items) {
            const createdItem = await addChecklistItem(createdSticky.id, {
              text: item.text,
              checked: item.checked,
            })
            if (createdItem) {
              createdItems.push(createdItem)
            }
          }

          // Update the sticky with the created items
          const stickyWithItems = {
            ...createdSticky,
            items: createdItems,
          }

          setStickies([...stickies, stickyWithItems])
        } else {
          // For note type or checklist without items
          setStickies([...stickies, createdSticky])
        }

        setNewSticky({
          title: "",
          content: "",
          color: COLORS[0] ?? "",
          type: "note",
          items: [],
        })
        setIsAddStickyOpen(false)
        toast.success("Sticky added successfully")
      }
    } catch (error) {
      console.error("Failed to create sticky:", error)
      toast.error("Failed to add sticky. Please try again.")
    }
  }

  const handleRemoveSticky = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const success = await deleteSticky(id)
      if (success) {
        setStickies(stickies.filter((sticky) => sticky.id !== id))
        toast.success("Sticky removed successfully")
      }
    } catch (error) {
      console.error("Failed to delete sticky:", error)
      toast.error("Failed to remove sticky. Please try again.")
    }
  }

  const handleAddChecklistItem = async (stickyId: string) => {
    if (!newChecklistItem.trim()) return

    try {
      const item = {
        text: newChecklistItem,
        checked: false,
      }

      const createdItem = await addChecklistItem(stickyId, item)

      if (createdItem) {
        setStickies(
          stickies.map((sticky) => {
            if (sticky.id === stickyId) {
              return {
                ...sticky,
                items: [...(sticky.items ?? []), createdItem],
              }
            }
            return sticky
          }),
        )

        setNewChecklistItem("")
        setAddingItemToSticky(null)
      }
    } catch (error) {
      console.error("Failed to add checklist item:", error)
      toast.error("Failed to add checklist item. Please try again.")
    }
  }

  const handleRemoveChecklistItem = async (stickyId: string, itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const success = await deleteChecklistItem(stickyId, itemId)
      if (success) {
        setStickies(
          stickies.map((sticky) => {
            if (sticky.id === stickyId) {
              return {
                ...sticky,
                items: sticky.items?.filter((item) => item.id !== itemId) ?? [],
              }
            }
            return sticky
          }),
        )
      }
    } catch (error) {
      console.error("Failed to delete checklist item:", error)
      toast.error("Failed to remove checklist item. Please try again.")
    }
  }

  const handleCheckboxChange = async (stickyId: string, itemId: string, checked: boolean) => {
    try {
      const updatedItem = await updateChecklistItem(stickyId, itemId, { checked })

      if (updatedItem) {
        setStickies(
          stickies.map((sticky) => {
            if (sticky.id === stickyId) {
              return {
                ...sticky,
                items: sticky.items?.map((item) => {
                  if (item.id === itemId) {
                    return { ...item, checked }
                  }
                  return item
                }),
              }
            }
            return sticky
          }),
        )
      }
    } catch (error) {
      console.error("Failed to update checklist item:", error)
      toast.error("Failed to update checklist item. Please try again.")
    }
  }

  const handleUpdateSticky = async (stickyId: string, field: string, value: string) => {
    try {
      const updatedSticky = await updateSticky(stickyId, { [field]: value })

      if (updatedSticky) {
        setStickies(
          stickies.map((sticky) => {
            if (sticky.id === stickyId) {
              return { ...sticky, [field]: value }
            }
            return sticky
          }),
        )
      }
    } catch (error) {
      console.error("Failed to update sticky:", error)
      toast.error("Failed to update sticky. Please try again.")
    }
  }

  const handleUpdateChecklistItem = async (stickyId: string, itemId: string, text: string) => {
    try {
      const updatedItem = await updateChecklistItem(stickyId, itemId, { text })

      if (updatedItem) {
        setStickies(
          stickies.map((sticky) => {
            if (sticky.id === stickyId) {
              return {
                ...sticky,
                items: sticky.items?.map((item) => {
                  if (item.id === itemId) {
                    return { ...item, text }
                  }
                  return item
                }),
              }
            }
            return sticky
          }),
        )
      }
    } catch (error) {
      console.error("Failed to update checklist item:", error)
      toast.error("Failed to update checklist item. Please try again.")
    }
  }

  const handleFormatText = (stickyId: string, format: "bold" | "italic" | "list", e: React.MouseEvent) => {
    e.stopPropagation()
    const sticky = stickies.find((s) => s.id === stickyId)
    if (!sticky || sticky.type !== "note") return

    let newContent = sticky.content

    switch (format) {
      case "bold":
        newContent = `**${newContent}**`
        break
      case "italic":
        newContent = `*${newContent}*`
        break
      case "list":
        newContent = `- ${newContent}`
        break
    }

    handleUpdateSticky(stickyId, "content", newContent)
  }

  const handleAddEmoji = (stickyId: string, emoji: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const sticky = stickies.find((s) => s.id === stickyId)
    if (!sticky) return

    if (sticky.type === "note") {
      handleUpdateSticky(stickyId, "content", sticky.content + emoji)
    } else if (sticky.type === "checklist") {
      handleUpdateSticky(stickyId, "title", sticky.title + emoji)
    }
  }

  const handleAddChecklistItemFromDialog = () => {
    if (!newChecklistItem.trim()) return

    const item: ChecklistItem = {
      id: Date.now().toString(), // This will be replaced by the backend with a proper UUID
      text: newChecklistItem,
      checked: false,
      user: "", // This will be set by the backend
    }

    setNewSticky({
      ...newSticky,
      items: [...(newSticky.items ?? []), item],
    })
    setNewChecklistItem("")
  }

  const handleRemoveChecklistItemFromDialog = (itemId: string) => {
    setNewSticky({
      ...newSticky,
      items: newSticky.items?.filter((item) => item.id !== itemId) ?? [],
    })
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg text-gray-400">Your stickies</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-400 hover:bg-gray-800"
            onClick={() => setIsAddStickyOpen(true)}
          >
            <Plus size={16} className="mr-1" /> Add sticky
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stickies.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">No stickies yet. Add your first one!</div>
          ) : (
            stickies.map((sticky) => (
              <div
                key={sticky.id}
                className="rounded-md p-4 flex flex-col h-[310px] cursor-pointer"
                style={{ backgroundColor: sticky.color }}
              >
                <div className="flex-grow">
                  {/* Title - editable */}
                  <div className="mb-3">
                    {editingField?.stickyId === sticky.id && editingField?.field === "title" ? (
                      <input
                        type="text"
                        value={sticky.title}
                        onChange={(e) => handleUpdateSticky(sticky.id, "title", e.target.value)}
                        onBlur={() => setEditingField(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setEditingField(null)
                          }
                        }}
                        className="bg-transparent text-gray-200 border-none outline-none w-full font-medium"
                        autoFocus
                        placeholder="Title..."
                      />
                    ) : (
                      <h3
                        className="text-gray-200 font-medium cursor-text"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingField({ stickyId: sticky.id, field: "title" })
                        }}
                      >
                        {sticky.title || "Click to add title..."}
                      </h3>
                    )}
                  </div>

                  {/* Content for note type */}
                  {sticky.type === "note" && (
                    <div>
                      {editingField?.stickyId === sticky.id && editingField?.field === "content" ? (
                        <textarea
                          value={sticky.content}
                          onChange={(e) => handleUpdateSticky(sticky.id, "content", e.target.value)}
                          onBlur={() => setEditingField(null)}
                          className="bg-transparent text-gray-300 border-none outline-none w-full resize-none h-32"
                          autoFocus
                          placeholder="Write your note here..."
                        />
                      ) : (
                        <p
                          className="text-gray-300 opacity-70 cursor-text h-32 overflow-y-auto"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingField({ stickyId: sticky.id, field: "content" })
                          }}
                        >
                          {sticky.content || "Click to type here"}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Content for checklist type */}
                  {sticky.type === "checklist" && (
                    <div className="space-y-2 h-32 overflow-y-auto">
                      {sticky.items?.map((item) => (
                        <div key={item.id} className="flex items-start gap-2 group">
                          <Checkbox
                            id={`${sticky.id}-${item.id}`}
                            className="mt-1 border-gray-500"
                            checked={item.checked}
                            onCheckedChange={(checked) => handleCheckboxChange(sticky.id, item.id, checked === true)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {editingField?.stickyId === sticky.id && editingField?.field === item.id ? (
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) => handleUpdateChecklistItem(sticky.id, item.id, e.target.value)}
                              onBlur={() => setEditingField(null)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  setEditingField(null)
                                }
                              }}
                              className="bg-transparent text-gray-300 border-none outline-none flex-grow text-sm"
                              autoFocus
                            />
                          ) : (
                            <label
                              htmlFor={`${sticky.id}-${item.id}`}
                              className="text-gray-300 text-sm flex-grow cursor-text"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingField({ stickyId: sticky.id, field: item.id })
                              }}
                            >
                              {item.text}
                            </label>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-200 w-4 h-4 p-0"
                            onClick={(e) => handleRemoveChecklistItem(sticky.id, item.id, e)}
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      ))}

                      {/* Add new item inline */}
                      {addingItemToSticky === sticky.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newChecklistItem}
                            onChange={(e) => setNewChecklistItem(e.target.value)}
                            onBlur={() => {
                              if (!newChecklistItem.trim()) {
                                setAddingItemToSticky(null)
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddChecklistItem(sticky.id)
                              } else if (e.key === "Escape") {
                                setNewChecklistItem("")
                                setAddingItemToSticky(null)
                              }
                            }}
                            className="bg-transparent text-gray-300 border-b border-gray-500 outline-none flex-grow text-sm"
                            placeholder="Add item..."
                            autoFocus
                          />
                        </div>
                      ) : (
                        <button
                          className="text-gray-400 text-sm hover:text-gray-300 text-left"
                          onClick={(e) => {
                            e.stopPropagation()
                            setAddingItemToSticky(sticky.id)
                          }}
                        >
                          + Add item
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-600/30">
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-300 hover:bg-gray-700/30 w-8 h-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Smile size={16} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="bg-gray-800 border-gray-700 p-2 w-auto">
                        <div className="flex flex-wrap gap-2">
                          {EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              className="p-1 hover:bg-gray-700 rounded"
                              onClick={(e) => handleAddEmoji(sticky.id, emoji, e)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {sticky.type === "note" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-300 hover:bg-gray-700/30 w-8 h-8"
                          onClick={(e) => handleFormatText(sticky.id, "bold", e)}
                        >
                          <Bold size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-300 hover:bg-gray-700/30 w-8 h-8"
                          onClick={(e) => handleFormatText(sticky.id, "italic", e)}
                        >
                          <Italic size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-300 hover:bg-gray-700/30 w-8 h-8"
                          onClick={(e) => handleFormatText(sticky.id, "list", e)}
                        >
                          <List size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-300 hover:bg-gray-700/30 w-8 h-8"
                    onClick={(e) => handleRemoveSticky(sticky.id, e)}
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Sticky Dialog */}
      <Dialog open={isAddStickyOpen} onOpenChange={setIsAddStickyOpen}>
        <DialogContent className="bg-gray-900 text-gray-200 border-gray-800">
          <DialogHeader>
            <DialogTitle>Add New Sticky</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm text-gray-400">
                Title (optional)
              </label>
              <Input
                id="title"
                value={newSticky.title}
                onChange={(e) => setNewSticky({ ...newSticky, title: e.target.value })}
                placeholder="Sticky title"
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Type</label>
              <div className="flex gap-2">
                <Button
                  variant={newSticky.type === "note" ? "default" : "outline"}
                  onClick={() => setNewSticky({ ...newSticky, type: "note" })}
                  className={newSticky.type === "note" ? "bg-blue-600" : "border-gray-700 text-gray-300"}
                >
                  Note
                </Button>
                <Button
                  variant={newSticky.type === "checklist" ? "default" : "outline"}
                  onClick={() => setNewSticky({ ...newSticky, type: "checklist" })}
                  className={newSticky.type === "checklist" ? "bg-blue-600" : "border-gray-700 text-gray-300"}
                >
                  Checklist
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Color</label>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full ${newSticky.color === color ? "ring-2 ring-white" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewSticky({ ...newSticky, color })}
                  />
                ))}
              </div>
            </div>

            {newSticky.type === "note" && (
              <div className="space-y-2">
                <label htmlFor="content" className="text-sm text-gray-400">
                  Content
                </label>
                <Textarea
                  id="content"
                  value={newSticky.content}
                  onChange={(e) => setNewSticky({ ...newSticky, content: e.target.value })}
                  placeholder="Write your note here..."
                  className="bg-gray-800 border-gray-700 text-gray-200 min-h-[100px]"
                />
              </div>
            )}

            {newSticky.type === "checklist" && (
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Checklist Items</label>
                <div className="space-y-2">
                  {newSticky.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Checkbox id={item.id} className="border-gray-500" />
                      <label htmlFor={item.id} className="text-gray-300 flex-grow">
                        {item.text}
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-gray-200"
                        onClick={() => handleRemoveChecklistItemFromDialog(item.id)}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Input
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      placeholder="Add item..."
                      className="bg-gray-800 border-gray-700 text-gray-200"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddChecklistItemFromDialog()
                        }
                      }}
                    />
                    <Button onClick={handleAddChecklistItemFromDialog} className="bg-blue-600 hover:bg-blue-700">
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddStickyOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button onClick={handleAddSticky} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Sticky
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
