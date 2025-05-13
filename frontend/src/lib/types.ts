export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export type TaskStatus = "todo" | "in-progress" | "completed"

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  assignee?: User
  createdAt: string
  updatedAt: string
  subtasks?: Task[]
  isSubtask?: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  startDate: string
  sprintDuration: number
  archived: boolean
  tasks: Task[]
}

export interface TaskStatusData {
  name: string
  value: number
  fill: string
}

export interface TasksTimeData {
  name: string
  value: number
}
