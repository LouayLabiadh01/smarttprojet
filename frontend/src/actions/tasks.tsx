/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server"

import { authenticate } from "./security/authenticate"

type User = {
  id: string
  username: string
}

type Project = {
  id: string
  name: string
}

type Task = {
  id: string
  title: string
  description: string
  status: "backlog" | "todo" | "inprogress" | "inreview" | "done"
  points: string
  priority: "none" | "low" | "medium" | "high" | "critical"
  type: "task" | "bug" | "feature" | "improvement" | "research" | "testing"
  backlogOrder: number
  last_edited_at: string | null
  inserted_date: string
  assignee: User | null
  projectId: Project
  sprintId: string | null
  branchName: string | null
  subTask: string | null
}

type UserProfile = {
  user_id: string
  username: string
  profilePicture: string
  role: "Admin" | "Chef" | "Membre"
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const userId = await authenticate()

    const response = await fetch(`${process.env.DJANGO_API_URL}/users/users/${userId}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function getRecentTasks(): Promise<Task[]> {
  try {
    const userId = await authenticate()

    // The backend will handle role-based filtering
    // Admin: Returns 5 recent tasks from all projects
    // Chef: Returns recent tasks from projects they manage
    // Membre: Returns their assigned tasks
    const response = await fetch(`${process.env.DJANGO_API_URL}/taches/tasks/recent/?user=${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch recent tasks: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching recent tasks:", error)
    return []
  }
}

export async function getAssignedTasks(): Promise<Task[]> {
  try {
    const userId = await authenticate()

    const response = await fetch(`${process.env.DJANGO_API_URL}/taches/tasks/assigned/?user=${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch assigned tasks: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching assigned tasks:", error)
    return []
  }
}

export async function getTaskById(id: string): Promise<Task | null> {
  try {
    const userId = await authenticate()

    const response = await fetch(`${process.env.DJANGO_API_URL}/taches/tasks/${id}/?user=${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch task: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching task:", error)
    return null
  }
}
