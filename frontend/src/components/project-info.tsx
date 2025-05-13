/* eslint-disable import/order */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { CalendarDays, Clock } from "lucide-react"
import { formatDate } from "~/lib/utils"

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
}


interface ProjectInfoProps {
  project: Project
}

export default function ProjectInfo({ project }: ProjectInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations du Projet</CardTitle>
        <CardDescription>Détails de base du projet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium">Nom</h3>
          <p className="text-sm text-muted-foreground">{project.name}</p>
        </div>
        <div>
          <h3 className="font-medium">Description</h3>
          <p className="text-sm text-muted-foreground">{project.description ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Début: {formatDate(project.sprint_start)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Durée des sprints: {project.sprint_duration} jours</span>
        </div>
        <div>
          <Badge variant={project.is_archived ? "destructive" : "default"}>
            {project.is_archived ? "Archivé" : "Actif"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
