/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server"

import { auth } from "@clerk/nextjs/server"

const API_URL = process.env.DJANGO_API_URL

interface AnalyticsData {
  totalUsers: number
  totalAdmins: number
  totalMembers: number
  totalGuests: number
  totalProjects: number
  totalWorkItems: number
  totalCompleted: number
  totalIncomplete: number
  workItemsByStatus: {
    total: number
    backlog: number
    todo: number
    inprogress: number
    inreview: number
    done: number
  }
  taskCreationTrend: Array<{
    date: string
    created: number
    resolved: number
  }>
  projectInsights: Array<{
    subject: string
    value: number
  }>
  activeProjects: Array<{
    id: number
    name: string
    completionRate: number
    color: string
  }>
}

async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const url = `${API_URL}${endpoint}`
  const defaultHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${userId}`,
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }

  return response.json()
}

export async function getAnalyticsData(projectId?: string): Promise<AnalyticsData> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    // Fetch all required data in parallel
    const [users, projects] = await Promise.all([
      makeApiRequest("/users/"),
      makeApiRequest(`/api/projects/user/${userId}/`),
    ])

    // Filter projects if specific project is selected
    const filteredProjects =
      projectId && projectId !== "all-projects" ? projects.filter((p: { id: { toString: () => string } }) => p.id.toString() === projectId) : projects

    const allTasks =
      projectId && projectId !== "all-projects"
        ? await makeApiRequest(`/taches/project/${projectId}/`)
        : await getAllUserTasks(userId)

    // Calculate user metrics
    const userMetrics = calculateUserMetrics(users)

    // Calculate project metrics
    const projectMetrics = calculateProjectMetrics(filteredProjects, allTasks)

    // Calculate task metrics
    const taskMetrics = calculateTaskMetrics(allTasks)

    // Calculate trends
    const taskTrend = calculateTaskCreationTrend(allTasks)

    // Calculate project insights
    const insights = calculateProjectInsights(filteredProjects, allTasks)

    // Get active projects with completion rates
    const activeProjects = calculateActiveProjects(filteredProjects, allTasks)

    return {
      ...userMetrics,
      ...projectMetrics,
      ...taskMetrics,
      taskCreationTrend: taskTrend,
      projectInsights: insights,
      activeProjects: activeProjects,
    }
  } catch (error) {
    console.error("Error fetching analytics data:", error)
    // Return default data if API fails
    return getDefaultAnalyticsData()
  }
}

async function getAllUserTasks(userId: string) {
  try {
    // First get all user projects
    const projects = await makeApiRequest(`/api/projects/user/${userId}/`)

    // Then get tasks for each project
    const allTasks = []
    for (const project of projects) {
      try {
        const tasks = await makeApiRequest(`/taches/project/${project.id}/`)
        allTasks.push(...tasks)
      } catch (error) {
        console.error(`Error fetching tasks for project ${project.id}:`, error)
      }
    }

    return allTasks
  } catch (error) {
    console.error("Error fetching user tasks:", error)
    return []
  }
}

function calculateUserMetrics(users: any[]) {
  const totalUsers = users.length
  const totalAdmins = users.filter((user) => user.role === "Admin").length
  const totalMembers = users.filter((user) => user.role === "Membre").length
  const totalGuests = users.filter((user) => user.role === "Guest").length

  return {
    totalUsers,
    totalAdmins,
    totalMembers,
    totalGuests,
  }
}

function calculateProjectMetrics(projects: any[], tasks: any[]) {
  const totalProjects = projects.filter((p) => !p.is_archived).length
  const totalWorkItems = tasks.length
  const totalCompleted = tasks.filter((task) => task.status === "done").length
  const totalIncomplete = tasks.filter((task) => task.status !== "done").length

  return {
    totalProjects,
    totalWorkItems,
    totalCompleted,
    totalIncomplete,
  }
}

function calculateTaskMetrics(tasks: any[]) {
  const workItemsByStatus = {
    total: tasks.length,
    backlog: tasks.filter((task) => task.status === "backlog").length,
    todo: tasks.filter((task) => task.status === "todo").length,
    inprogress: tasks.filter((task) => task.status === "inprogress").length,
    inreview: tasks.filter((task) => task.status === "inreview").length,
    done: tasks.filter((task) => task.status === "done").length,
  }

  return { workItemsByStatus }
}

function calculateTaskCreationTrend(tasks: any[]) {
  // Group tasks by month for the last 4 months
  const now = new Date()
  const months = []

  for (let i = 3; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const created = tasks.filter((task) => {
      const taskDate = new Date(task.inserted_date)
      return taskDate >= monthStart && taskDate <= monthEnd
    }).length

    const resolved = tasks.filter((task) => {
      const taskDate = new Date(task.last_edited_at || task.inserted_date)
      return task.status === "done" && taskDate >= monthStart && taskDate <= monthEnd
    }).length

    months.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      created,
      resolved,
    })
  }

  return months
}

function calculateProjectInsights(projects: any[], tasks: any[]) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === "done").length
  const inProgressTasks = tasks.filter((task) => task.status === "inprogress").length
  const reviewTasks = tasks.filter((task) => task.status === "inreview").length

  return [
    { subject: "Work Items", value: Math.min(100, (totalTasks / 10) * 100) },
    { subject: "Completed", value: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0 },
    { subject: "In Progress", value: totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0 },
    { subject: "In Review", value: totalTasks > 0 ? (reviewTasks / totalTasks) * 100 : 0 },
    { subject: "Projects", value: Math.min(100, (projects.length / 5) * 100) },
  ]
}

function calculateActiveProjects(projects: any[], tasks: any[]) {
  return projects
    .filter((project) => !project.is_archived)
    .map((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id)
      const completedTasks = projectTasks.filter((task) => task.status === "done").length
      const completionRate = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0

      return {
        id: project.id,
        name: project.name,
        completionRate,
        color: project.color || "#000000",
      }
    })
    .slice(0, 10) // Limit to top 10 projects
}

function getDefaultAnalyticsData(): AnalyticsData {
  return {
    totalUsers: 0,
    totalAdmins: 0,
    totalMembers: 0,
    totalGuests: 0,
    totalProjects: 0,
    totalWorkItems: 0,
    totalCompleted: 0,
    totalIncomplete: 0,
    workItemsByStatus: {
      total: 0,
      backlog: 0,
      todo: 0,
      inprogress: 0,
      inreview: 0,
      done: 0,
    },
    taskCreationTrend: [
      { date: "Feb 01, 2025", created: 0, resolved: 0 },
      { date: "Mar 01, 2025", created: 0, resolved: 0 },
      { date: "Apr 01, 2025", created: 0, resolved: 0 },
      { date: "May 01, 2025", created: 0, resolved: 0 },
    ],
    projectInsights: [
      { subject: "Work Items", value: 0 },
      { subject: "Completed", value: 0 },
      { subject: "In Progress", value: 0 },
      { subject: "In Review", value: 0 },
      { subject: "Projects", value: 0 },
    ],
    activeProjects: [],
  }
}
