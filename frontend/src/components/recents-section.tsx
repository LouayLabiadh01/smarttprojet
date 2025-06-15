/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable import/order */
"use client"

import { useState, useEffect } from "react"
import { Package, Check, X, SmilePlus, Crown, Users, User } from "lucide-react"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { getRecentTasks, getUserProfile } from "~/actions/tasks"
import { toast } from "~/actions/toast-setup"

type UserType = {
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
  assignee: UserType | null
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

export function RecentsSection() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch user profile and recent tasks in parallel
        const [profileData, tasksData] = await Promise.all([getUserProfile(), getRecentTasks()])

        setUserProfile(profileData)
        setTasks(tasksData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to load recent tasks. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) {
      return "just now"
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`
    } else if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`
    } else {
      const months = Math.floor(diffInDays / 30)
      return `${months} ${months === 1 ? "month" : "months"} ago`
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <Check size={14} className="text-white" />
          </div>
        )
      case "inreview":
        return (
          <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
            <SmilePlus size={14} className="text-white" />
          </div>
        )
      case "todo":
        return (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <Package size={14} className="text-white" />
          </div>
        )
      case "inprogress":
        return (
          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
            <Package size={14} className="text-white" />
          </div>
        )
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <X size={14} className="text-white" />
          </div>
        )
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Admin":
        return <Crown size={14} className="text-yellow-400" />
      case "Chef":
        return <Users size={14} className="text-blue-400" />
      case "Membre":
        return <User size={14} className="text-gray-400" />
      default:
        return <User size={14} className="text-gray-400" />
    }
  }

  const getRoleBasedTitle = (role: string) => {
    switch (role) {
      case "Admin":
        return "Recent Tasks (All Projects)"
      case "Chef":
        return "Recent Tasks (Your Projects)"
      case "Membre":
        return "Your Recent Tasks"
      default:
        return "Recent Tasks"
    }
  }

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg text-gray-400">{userProfile ? getRoleBasedTitle(userProfile.role) : "Recents"}</h2>
          {userProfile && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-full">
              {getRoleIcon(userProfile.role)}
              <span className="text-xs text-gray-300">{userProfile.role}</span>
            </div>
          )}
        </div>
        <button className="text-sm text-gray-400 hover:text-gray-300">
          All <span className="ml-1">›</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {userProfile?.role === "Admin"
                ? "No recent tasks found across all projects."
                : userProfile?.role === "Chef"
                  ? "No recent tasks found in your managed projects."
                  : "No recent tasks assigned to you."}
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-md hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-800 rounded-md">
                    <Package size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">
                        {task.projectId.name}-{task.id}
                      </span>
                      <span className="text-gray-300">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">{formatDate(task.inserted_date)}</p>
                      {task.assignee && userProfile?.role === "Admin" && (
                        <span className="text-xs text-gray-500">• Assigned to {task.assignee.username}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex items-center">{getStatusIcon(task.status)}</div>
                  {task.assignee && (
                    <div className="flex -space-x-1">
                      <Avatar className="w-6 h-6 border border-gray-800">
                        <AvatarFallback className="bg-blue-500 text-[10px]">
                          {getInitials(task.assignee.username)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
