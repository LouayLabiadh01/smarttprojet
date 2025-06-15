/* eslint-disable import/order */
"use client"

import { useMemo, useState } from "react"
import type { StatefulTask } from "~/features/tasks/config/taskConfigType"

export interface TaskNode {
  task: StatefulTask
  children: TaskNode[]
  level: number
  isExpanded: boolean
}

export function useTaskHierarchy(tasks: StatefulTask[] | undefined) {
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set())

  const taskHierarchy = useMemo(() => {
    if (!tasks) return []

    // Separate main tasks and subtasks
    const mainTasks = tasks.filter((task) => !task.subTask || task.subTask === "")
    const subTasks = tasks.filter((task) => task.subTask && task.subTask !== "")

    // Group subtasks by parent ID
    const subTasksByParent = subTasks.reduce(
      (acc, task) => {
        const parentId = Number.parseInt(task.subTask ?? "")
        if (!acc[parentId]) {
          acc[parentId] = []
        }
        acc[parentId].push(task)
        return acc
      },
      {} as Record<number, StatefulTask[]>,
    )

    // Build hierarchy
    const buildTaskNode = (task: StatefulTask, level = 0): TaskNode => {
      const children = (subTasksByParent[task.id] ?? []).map((childTask) => buildTaskNode(childTask, level + 1))

      return {
        task,
        children,
        level,
        isExpanded: expandedTasks.has(task.id),
      }
    }

    return mainTasks.map((task) => buildTaskNode(task))
  }, [tasks, expandedTasks])

  const toggleExpanded = (taskId: number) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const flattenHierarchy = (nodes: TaskNode[]): { task: StatefulTask; level: number; hasChildren: boolean }[] => {
    const result: { task: StatefulTask; level: number; hasChildren: boolean }[] = []

    const traverse = (node: TaskNode) => {
      result.push({
        task: node.task,
        level: node.level,
        hasChildren: node.children.length > 0,
      })

      if (node.isExpanded && node.children.length > 0) {
        node.children.forEach(traverse)
      }
    }

    nodes.forEach(traverse)
    return result
  }

  return {
    taskHierarchy,
    expandedTasks,
    toggleExpanded,
    flattenHierarchy,
  }
}
