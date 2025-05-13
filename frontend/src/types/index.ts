export interface Project {
  id: string
  name: string
  description: string
  startDate: string
  sprintDuration: number
  archived: boolean
  sprints: Sprint[]
  tasks: Task[]
}

export interface Sprint {
  id: string
  number: number
  startDate: string
  endDate: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "completed"
  assignee: string
  sprintId: string
  subTasks?: SubTask[]
}

export interface SubTask {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "completed"
  assignee: string
}
