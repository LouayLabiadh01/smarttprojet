/* eslint-disable import/order */
"use client"

import { useMemo } from "react"

import {
  Draggable,
  type DraggableProvided,
  type DraggableStateSnapshot,
  Droppable,
  type DroppableProvided,
  type DroppableStateSnapshot,
} from "@hello-pangea/dnd"
import { DragHandleDots2Icon } from "@radix-ui/react-icons"
import type { UseMutationResult } from "@tanstack/react-query"

import Task from "~/features/tasks/components/backlog/Task"
import type { UpdateTask } from "~/features/tasks/components/backlog/TasksContainer"
import type { StatefulTask } from "~/features/tasks/config/taskConfigType"
import { filterTasks } from "~/features/tasks/utils/filter"
import { cn } from "~/lib/utils"
import { useAppStore, type Filter } from "~/store/app"
import { useTaskHierarchy } from "../hooks/useTaskHierarchy"
import SubTaskIndicator from "./SubTaskIndicator"
import CreateSubTask from "./CreateSubTask"

type Props = {
  listId: string
  taskOrder: number[]
  tasks: StatefulTask[] | undefined
  filters: Filter[]
  addTaskMutation: UseMutationResult<void, Error, UpdateTask, unknown>
  deleteTaskMutation: UseMutationResult<void, Error, number, unknown>
  projectId: string
}

const TaskList = ({ listId, taskOrder, tasks, filters, addTaskMutation, deleteTaskMutation, projectId }: Props) => {
  const groupByBacklog = useAppStore((state) => state.groupByBacklog)
  const { taskHierarchy, toggleExpanded, flattenHierarchy } = useTaskHierarchy(tasks)

  const groupBy = useMemo(() => {
    return groupByBacklog
  }, [groupByBacklog])

  const filteredAndOrderedTasks = useMemo(() => {
    if (!tasks) return []

    // Filter tasks based on current filters
    const filtered = tasks.filter((task) => filterTasks(task, filters))

    // If we're grouping, filter by the current list
    let relevantTasks = filtered
    if (listId !== "tasks" && groupBy) {
      relevantTasks = filtered.filter((task) => {
        let groupValue = task[groupBy]
        if (groupBy === "sprintId") {
          groupValue = String(groupValue)
        } else if (groupBy === "assignee" && groupValue === null) {
          groupValue = "unassigned"
        }
        return groupValue === listId
      })
    }

    // Build hierarchy for relevant tasks
    const mainTasks = relevantTasks.filter((task) => !task.subTask || task.subTask === "")
    const subTasks = relevantTasks.filter((task) => task.subTask && task.subTask !== "")

    // Group subtasks by parent
    const subTasksByParent = subTasks.reduce(
      (acc, task) => {
        const parentId = Number.parseInt(task.subTask ?? "")
        if (!acc[parentId]) acc[parentId] = []
        acc[parentId].push(task)
        return acc
      },
      {} as Record<number, StatefulTask[]>,
    )

    // Create ordered list respecting hierarchy
    const result: { task: StatefulTask; level: number; hasChildren: boolean }[] = []

    // Sort main tasks by taskOrder
    const sortedMainTasks = mainTasks.sort((a, b) => {
      const aIndex = taskOrder.indexOf(a.id)
      const bIndex = taskOrder.indexOf(b.id)
      return aIndex - bIndex
    })

    sortedMainTasks.forEach((mainTask) => {
      const hasChildren = (subTasksByParent[mainTask.id] ?? []).length > 0
      result.push({ task: mainTask, level: 0, hasChildren })

      // Add subtasks if parent is expanded
      const isExpanded = taskHierarchy.find((node) => node.task.id === mainTask.id)?.isExpanded
      if (isExpanded && hasChildren) {
        const sortedSubTasks = (subTasksByParent[mainTask.id] ?? []).sort((a, b) => {
          const aIndex = taskOrder.indexOf(a.id)
          const bIndex = taskOrder.indexOf(b.id)
          return aIndex - bIndex
        })

        sortedSubTasks.forEach((subTask) => {
          result.push({ task: subTask, level: 1, hasChildren: false })
        })
      }
    })

    return result
  }, [tasks, taskOrder, filters, listId, groupBy, taskHierarchy])

  if (!tasks) {
    return null
  }

  return (
    <Droppable droppableId={listId}>
      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={cn("min-h-2", {
            "bg-accent/50": snapshot.isDraggingOver && listId !== "tasks",
          })}
        >
          {filteredAndOrderedTasks.map(({ task, level, hasChildren }, idx) => (
            <Draggable draggableId={String(task.id)} index={idx} key={task.id}>
              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                <div
                  className={cn("group relative backdrop-blur-xl transition-all", {
                    "bg-accent-foreground/5": snapshot.isDragging,
                    "ml-4": level > 0, // Indent subtasks
                  })}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  ref={provided.innerRef}
                >
                  <div className="flex items-center">
                    <SubTaskIndicator
                      hasSubTasks={hasChildren}
                      isExpanded={taskHierarchy.find((node) => node.task.id === task.id)?.isExpanded ?? false}
                      onToggle={() => toggleExpanded(task.id)}
                      level={level}
                    />

                    <DragHandleDots2Icon
                      className={cn(
                        "absolute bottom-[50%] left-8 translate-y-[50%] text-foreground opacity-0 group-hover:opacity-50",
                        snapshot.isDragging && "opacity-100",
                      )}
                    />

                    <div className="flex-1">
                      <Task
                        key={task.id}
                        task={task}
                        addTaskMutation={addTaskMutation}
                        deleteTaskMutation={deleteTaskMutation}
                        projectId={projectId}
                        listId={listId}
                        comments={task.comments}
                      />
                    </div>

                    {level === 0 && (
                      <div className="pr-2">
                        <CreateSubTask parentTaskId={task.id} projectId={projectId} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}

export default TaskList
