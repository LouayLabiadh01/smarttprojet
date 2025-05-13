/* eslint-disable import/order */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export interface Project {
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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

export function calculateProjectProgress(project: Project): number {
  const total = project.tasks_summary.total
  const done = project.tasks_summary.done
  if (total === 0) return 0
  return Math.round((done / total) * 100)
}

export function getTaskStatusData(project: Project): { name: string; value: number; fill: string }[] {
  const { status } = project.charts

  if (!status || status.length === 0) {
    return [{ name: "Aucune tâche", value: 1, fill: "#d1d5db" }]
  }

  const statusMap: Record<string, string> = {
    "todo": "#f97316",
    "in-progress": "#3b82f6",
    "completed": "#22c55e",
    "À faire": "#f97316",
    "En cours": "#3b82f6",
    "Terminé": "#22c55e",
  }

  return status.map((entry) => ({
    name: entry.name,
    value: entry.value,
    fill: statusMap[entry.name.toLowerCase()] ?? "#a1a1aa", // default gray
  }))
}

export function getTasksCompletedBySprintData(project: Project): { name: string; value: number }[] {
  return project.charts.by_sprint.length > 0
    ? project.charts.by_sprint
    : [{ name: "Aucun sprint", value: 1 }]
}

export function getTasksCompletedByWeekData(project: Project): { name: string; value: number }[] {
  return project.charts.by_week.length > 0
    ? project.charts.by_week
    : [{ name: "Aucune semaine", value: 1 }]
}
