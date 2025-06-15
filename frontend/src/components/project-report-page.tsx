/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable import/order */
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import ProjectSelector from "~/components/project-selector"
import ProjectInfo from "~/components/project-info"
import ProjectProgress from "~/components/project-progress"
import ProjectCharts from "~/components/project-charts"
import TasksTable from "~/components/tasks-table"
import PdfExportButton from "~/components/pdf-export-button"
import PageHeader from "./layout/PageHeader"

interface User {
  id: number
  username: string
  profilePicture?: string
}

interface Task {
  id: string
  title: string
  status: "todo" | "inprogress" | "done" | "backlog" | "inreview"
  assignee?: User
}

interface Project {
  id: number
  name: string
  description?: string
  color: string
  sprint_duration: number
  sprint_start: string
  image?: string
  is_ai_enabled: boolean
  is_archived: boolean
  tasks_summary: {
    total: number
    done: number
    in_progress: number
  }
  charts: {
    by_week: { name: string; value: number }[]
    by_sprint: { name: string; value: number }[]
    status: { name: string; value: number }[]
  }
  tasks: Task[]
}


export default function ProjectReportPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)

  async function fetchProjectsFromBackend() {
    try {
      const res = await fetch("http://localhost:8000/api/projects/", { cache: "no-store" }) // Update with your backend URL if different
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setProjects(data)
      if (data.length > 0) {
        setSelectedProjectId(data[0].id.toString())
      }
    } catch (error) {
      console.error("Erreur API:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjectsFromBackend()
  }, [])

  const selectedProject = projects.find((project) => project.id.toString() === selectedProjectId)

  if (loading) return <div className="p-4">Chargement...</div>
  if (!selectedProject) return <div className="p-4">Projet non trouvé</div>

  return (
    <>
    <PageHeader breadCrumbs></PageHeader>
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapport de Projet</h1>
          <p className="text-muted-foreground">Générez un rapport détaillé pour le projet sélectionné</p>
        </div>
        <div className="flex items-center gap-4">
          <ProjectSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
          />
          <PdfExportButton project={selectedProject} />
        </div>
      </div>

      <Tabs defaultValue="apercu" className="space-y-4">
        <TabsList>
          <TabsTrigger value="apercu">Aperçu</TabsTrigger>
          <TabsTrigger value="details">Détails</TabsTrigger>
        </TabsList>
        <TabsContent value="apercu" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ProjectInfo project={selectedProject} />
            <ProjectProgress project={selectedProject} />
            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
                <CardDescription>Options pour ce projet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <PdfExportButton project={selectedProject} fullWidth />
              </CardContent>
            </Card>
          </div>
          <ProjectCharts project={selectedProject} />
        </TabsContent>
        <TabsContent value="details" className="space-y-4">
          <TasksTable project={selectedProject} />
        </TabsContent>
      </Tabs>
    </div>
    </>
  )
}
