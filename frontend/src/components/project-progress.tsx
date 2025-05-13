import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"

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


interface ProjectProgressProps {
  project: Project
}

export default function ProjectProgress({ project }: ProjectProgressProps) {
  const { total, done, in_progress } = project.tasks_summary
  const todo = total - done - in_progress
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progression Globale</CardTitle>
        <CardDescription>Basée sur les tâches complétées</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progression</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <span className="text-2xl font-bold">{todo}</span>
            <p className="text-xs text-muted-foreground">À faire</p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-bold">{in_progress}</span>
            <p className="text-xs text-muted-foreground">En cours</p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-bold">{done}</span>
            <p className="text-xs text-muted-foreground">Terminées</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
