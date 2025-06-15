/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable import/order */
"use client"

import { useState, useEffect } from "react"
import { Search, Settings, Link2, Star, ThumbsUp, Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Textarea } from "~/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"
import { getAllProjects, updateProject } from "~/actions/project-actions"
import { createProject, type CreateForm } from "~/actions/create-project"
import { handleDeleteProjects as deleteProjectAction } from "~/features/settings/actions/settings-actions"
import { useRouter } from "next/navigation"
import PageHeader from "~/components/layout/PageHeader"

// Project type definition matching Django model
type Project = {
  id: string
  name: string
  sprint_duration: number
  sprint_start: string
  description: string
  image: string | null
  color: string
  is_ai_enabled: boolean
  github_integration_id: number | null
  is_archived: boolean
  date_archivage: string | null
}

// Frontend display type
type DisplayProject = {
  id: string
  name: string
  subtitle: string
  description: string
  image: string
  starred: boolean
  createdAt: Date
  color: string
  is_ai_enabled: boolean
  is_archived: boolean
}

export default function ProjectsDashboard() {
  const { user } = useUser()
  const [projects, setProjects] = useState<DisplayProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for modals and forms
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentProject, setCurrentProject] = useState<DisplayProject | null>(null)
  const [newProject, setNewProject] = useState<Partial<CreateForm>>({
    name: "",
    description: "",
    sprint_duration: 2,
    is_ai_enabled: false,
    sprint_start: new Date(),
    invitees: [],
    timezoneOffset: new Date().getTimezoneOffset(),
    image: "http://localhost:3000/placeholder.jpg",
    color: "#3B82F6",
  })

  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest")
  const [filterType, setFilterType] = useState<"all" | "starred" | "archived">("all")

  // Convert Django project to display project
  const convertToDisplayProject = (project: Project): DisplayProject => ({
    id: project.id,
    name: project.name,
    subtitle: `Sprint ${project.sprint_duration}w`,
    description: project.description ?? "No description",
    image: project.image ?? "http://localhost:3000/placeholder.jpg",
    starred: false, // You might want to add this to your Django model
    createdAt: new Date(project.sprint_start),
    color: project.color ?? "#3B82F6",
    is_ai_enabled: project.is_ai_enabled,
    is_archived: project.is_archived,
  })

  // Fetch projects from server action
  const fetchProjects = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      const data = await getAllProjects(user.id)

      if (data && Array.isArray(data)) {
        const displayProjects = data.map(convertToDisplayProject)
        setProjects(displayProjects)
      } else {
        setProjects([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      toast.error("Failed to fetch projects. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Load projects on component mount
  useEffect(() => {
    if (user?.id) {
      fetchProjects()
    }
  }, [user?.id])

  // Handle adding a new project
  const handleAddProject = async () => {
    if (!newProject.name) {
      toast.error("Project name is required.")
      return
    }

    try {
      const projectData: CreateForm = {
        name: newProject.name,
        description: newProject.description ?? "",
        sprint_duration: newProject.sprint_duration ?? 2,
        is_ai_enabled: newProject.is_ai_enabled ?? false,
        sprint_start: newProject.sprint_start ?? new Date(),
        invitees: newProject.invitees ?? [],
        timezoneOffset: new Date().getTimezoneOffset(),
        image: newProject.image ?? "http://localhost:3000/placeholder.jpg",
        color: newProject.color ?? "#3B82F6",
      }

      const result = await createProject(projectData)

      if (result.status) {
        toast.success(result.message || "Project created successfully!")

        // Refresh projects list
        await fetchProjects()

        // Reset form
        setNewProject({
          name: "",
          description: "",
          sprint_duration: 2,
          is_ai_enabled: false,
          sprint_start: new Date(),
          invitees: [],
          timezoneOffset: new Date().getTimezoneOffset(),
          image: "http://localhost:3000/placeholder.jpg",
          color: "#3B82F6",
        })
        setIsAddModalOpen(false)
      } else {
        toast.error(result.message || "Failed to create project.")
      }
    } catch (err) {
      toast.error("Failed to create project. Please try again.")
    }
  }

  // Handle editing a project
  const handleEditProject = async () => {
    if (!currentProject) return

    try {
      const updateData = {
        name: currentProject.name,
        description: currentProject.description,
        color: currentProject.color,
        is_ai_enabled: currentProject.is_ai_enabled,
      }

      const result = await updateProject(Number.parseInt(currentProject.id, 10), updateData)

      if (result && result.success !== false) {
        setProjects(projects.map((p) => (p.id === currentProject.id ? currentProject : p)))
        setIsEditModalOpen(false)
        setCurrentProject(null)

        toast.success("Project updated successfully!")
      } else {
        throw new Error("Update failed")
      }
    } catch (err) {
      toast.error("Failed to update project. Please try again.")
    }
  }
  const router = useRouter();
  // Handle deleting a project
  const handleProjectDelete = async (id: string) => {
    try {
      const result = await deleteProjectAction(Number.parseInt(id, 10))

      // Since your action redirects on success, we only handle the error case
      if (result && "success" in result && result.success === false) {
        toast.error(result && "message" in result ? result.message : "Failed to delete project.")
        return
      }

      // If we reach here, deletion was successful (no redirect means error)
      toast.success("Project deleted successfully!")
      router.refresh();
    } catch (err) {
      toast.error("Failed to delete project. Please try again.")
    }
  }

  // Handle toggling star status (local state only - you might want to persist this)
  const handleToggleStar = (id: string) => {
    setProjects(projects.map((p) => (p.id === id ? { ...p, starred: !p.starred } : p)))
  }

  // Handle archiving a project
  const handleArchiveProject = async (id: string) => {
    try {
      const updateData = {
        is_archived: true,
        date_archivage: new Date().toISOString(),
      }

      const result = await updateProject(Number.parseInt(id, 10), updateData)

      if (result && result.success !== false) {
        setProjects(projects.map((p) => (p.id === id ? { ...p, is_archived: true } : p)))

        toast.success("Project archived successfully!")
      } else {
        throw new Error("Archive failed")
      }
    } catch (err) {
      toast.error("Failed to archive project. Please try again.")
    }
  }

  // Filter and sort projects
  const filteredProjects = projects
    .filter((project) => {
      // Apply search filter
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())

      // Apply type filter
      let matchesType = true
      if (filterType === "starred") {
        matchesType = project.starred
      } else if (filterType === "archived") {
        matchesType = project.is_archived
      } else if (filterType === "all") {
        matchesType = !project.is_archived
      }

      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === "newest") {
        return b.createdAt.getTime() - a.createdAt.getTime()
      } else if (sortBy === "oldest") {
        return a.createdAt.getTime() - b.createdAt.getTime()
      } else {
        return a.name.localeCompare(b.name)
      }
    })

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
          <p className="text-gray-400">You need to be signed in to view your projects.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading projects...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error loading projects</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={fetchProjects}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto p-4">
        <PageHeader breadCrumbs></PageHeader>
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium">Projects</h1>
            <span className="text-sm text-gray-400">({filteredProjects.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9 bg-gray-900 border-gray-800 w-full"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-[140px] bg-gray-900 border-gray-800">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
              <SelectTrigger className="w-[120px] bg-gray-900 border-gray-800">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Active</SelectItem>
                <SelectItem value="starred">Starred</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </div>
        </header>

        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-gray-800 p-4 rounded-full mb-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium mb-2">No projects found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-lg overflow-hidden bg-gray-900 transition-all hover:shadow-lg border border-gray-800"
              >
                <div className="relative h-40">
                  <img
                    src={project.image || "/placeholder.svg?height=160&width=400"}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-4">
                    <div className="flex items-center gap-2">
                      {project.is_ai_enabled ? (
                        <div className="p-1 rounded-md bg-yellow-500/20 text-yellow-500">
                          <ThumbsUp className="h-5 w-5" />
                        </div>
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{ backgroundColor: project.color }}
                        >
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <p className="text-sm text-gray-300">{project.subtitle}</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button className="p-1.5 rounded-full bg-black/40 hover:bg-black/60">
                      <Link2 className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1.5 rounded-full bg-black/40 hover:bg-black/60"
                      onClick={() => handleToggleStar(project.id)}
                    >
                      <Star className={`h-4 w-4 ${project.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    </button>
                  </div>
                  {project.is_archived && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs">
                      Archived
                    </div>
                  )}
                </div>
                <div className="p-4 flex items-center justify-between">
                  <p className="text-sm text-gray-400 flex-1 mr-2">{project.description}</p>
                  <div className="flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-full hover:bg-gray-800">
                          <Settings className="h-4 w-4 text-gray-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                        <DropdownMenuItem
                          className="cursor-pointer hover:bg-gray-800"
                          onClick={() => {
                            setCurrentProject(project)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit project
                        </DropdownMenuItem>
                        {!project.is_archived && (
                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-gray-800"
                            onClick={() => handleArchiveProject(project.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Archive project
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="cursor-pointer text-red-500 hover:bg-gray-800 hover:text-red-500"
                          onClick={() => handleProjectDelete(project.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-800 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                className="bg-gray-800 border-gray-700"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Project Cover Image</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  "https://img.freepik.com/free-vector/hand-drawn-doodle-background_23-2149968646.jpg?semt=ais_hybrid&w=740",
                  "https://img.freepik.com/free-vector/hand-drawn-doodle-background_23-2149995469.jpg",
                  "https://img.freepik.com/free-vector/hand-drawn-flat-abstract-shapes-background_23-2149070869.jpg",
                  "https://img.freepik.com/premium-photo/bright-bold-geometric-shapes-create-playful-vibrant-abstract-background-that-catches-eye_1137529-93770.jpg",
                  "https://img.freepik.com/premium-photo/explore-vibrant-modern-backgrounds-showcasing-dynamic-shapes-abstract-elements-fresh_1137529-100660.jpg",
                  "https://img.freepik.com/vector-gratis/fondo-floral-acuarela-pintada-mano_23-2149011310.jpg",
                ].map((imageUrl, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      newProject.image === imageUrl
                        ? "border-blue-500 ring-2 ring-blue-500/20"
                        : "border-gray-600 hover:border-gray-500"
                    }`}
                    onClick={() => setNewProject({ ...newProject, image: imageUrl })}
                  >
                    <img
                      src={imageUrl || "/placeholder.svg"}
                      alt={`Cover option ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {newProject.image === imageUrl && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <Label htmlFor="custom-image">Or enter custom image URL</Label>
                <Input
                  id="custom-image"
                  className="bg-gray-800 border-gray-700 mt-1"
                  placeholder="https://example.com/image.jpg"
                  value={newProject.image && !newProject.image.includes("placeholder.svg") ? newProject.image : ""}
                  onChange={(e) => setNewProject({ ...newProject, image: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Project Color</Label>
              <div className="flex gap-2 mb-2">
                {[
                  "#3B82F6", // Blue
                  "#10B981", // Green
                  "#F59E0B", // Yellow
                  "#EF4444", // Red
                  "#8B5CF6", // Purple
                  "#F97316", // Orange
                  "#06B6D4", // Cyan
                  "#84CC16", // Lime
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newProject.color === color
                        ? "border-white ring-2 ring-gray-400"
                        : "border-gray-600 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewProject({ ...newProject, color })}
                  >
                    {newProject.color === color && (
                      <svg className="w-4 h-4 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <Input
                type="color"
                className="bg-gray-800 border-gray-700 h-10"
                value={newProject.color ?? "#3B82F6"}
                onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sprint_duration">Sprint Duration (weeks)</Label>
              <Input
                id="sprint_duration"
                type="number"
                min="1"
                max="12"
                className="bg-gray-800 border-gray-700"
                value={newProject.sprint_duration}
                onChange={(e) =>
                  setNewProject({ ...newProject, sprint_duration: Number.parseInt(e.target.value, 10) || 2 })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                className="bg-gray-800 border-gray-700"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sprint_start">Sprint Start Date</Label>
              <Input
                id="sprint_start"
                type="date"
                className="bg-gray-800 border-gray-700"
                value={newProject.sprint_start?.toISOString().split("T")[0]}
                onChange={(e) => setNewProject({ ...newProject, sprint_start: new Date(e.target.value) })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="ai_enabled"
                type="checkbox"
                checked={newProject.is_ai_enabled}
                onChange={(e) => setNewProject({ ...newProject, is_ai_enabled: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="ai_enabled">Enable AI features</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddProject}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-800 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {currentProject && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Project Name</Label>
                <Input
                  id="edit-name"
                  className="bg-gray-800 border-gray-700"
                  value={currentProject.name}
                  onChange={(e) => setCurrentProject({ ...currentProject, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  className="bg-gray-800 border-gray-700"
                  value={currentProject.description}
                  onChange={(e) => setCurrentProject({ ...currentProject, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-color">Project Color</Label>
                <Input
                  id="edit-color"
                  type="color"
                  className="bg-gray-800 border-gray-700 h-10"
                  value={currentProject.color}
                  onChange={(e) => setCurrentProject({ ...currentProject, color: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="edit-ai_enabled"
                  type="checkbox"
                  checked={currentProject.is_ai_enabled}
                  onChange={(e) => setCurrentProject({ ...currentProject, is_ai_enabled: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit-ai_enabled">Enable AI features</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleEditProject}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
