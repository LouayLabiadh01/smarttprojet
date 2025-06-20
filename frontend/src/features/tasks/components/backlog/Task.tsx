/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client"

import { useCallback, useEffect, useMemo } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import type { UseMutationResult } from "@tanstack/react-query"
import { cva, type VariantProps } from "class-variance-authority"
import { MessageCircle, Layers } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { useShallow } from "zustand/react/shallow"

import { useRegisterCommands } from "~/features/cmd-menu/registerCommands"
import type { UpdateTask } from "~/features/tasks/components/backlog/TasksContainer"
import { taskFormSchema, type TaskFormType } from "~/features/tasks/components/CreateTask"
import {
  type Option,
  type TaskProperty,
  getEnumOptionByKey,
  getPropertyConfig,
} from "~/features/tasks/config/taskConfigType"
import { cn } from "~/lib/utils"
import type { Task as TaskType } from "~/schema"
import { usePointStore } from "~/store/point"
import { useRealtimeStore } from "~/store/realtime"
import TaskDropDownMenu from "./TaskDropDownMenu"
import Property from "../property/Property"
import PropertyBadge from "../property/PropertyBadge"

const taskVariants = cva(["flex items-center gap-2"], {
  variants: {
    variant: {
      backlog:
        "flex items-center justify-between border-b border-border/50 py-2 hover:bg-accent-foreground/5 group-data-[state=open]/context:bg-accent-foreground/5 ",
      list: "",
    },
  },
  defaultVariants: {
    variant: "backlog",
  },
})

export type VariantPropsType = VariantProps<typeof taskVariants>

const orders: Record<
  Exclude<VariantPropsType["variant"], null | undefined>,
  { key: TaskProperty | "comments" | "subtask-indicator"; size: "default" | "icon" }[][]
> = {
  backlog: [
    [
      { key: "status", size: "icon" },
      { key: "points", size: "icon" },
      { key: "title", size: "default" },
    ],
    [
      { key: "comments", size: "icon" },
      { key: "subtask-indicator", size: "icon" },
      { key: "type", size: "default" },
      { key: "assignee", size: "icon" },
      { key: "sprintId", size: "icon" },
      { key: "priority", size: "icon" },
    ],
  ],
  list: [
    [
      { key: "status", size: "default" },
      { key: "assignee", size: "default" },
      { key: "points", size: "default" },
      { key: "type", size: "default" },
      { key: "sprintId", size: "default" },
      { key: "priority", size: "default" },
    ],
  ],
}

interface Props extends VariantPropsType {
  task: TaskType
  addTaskMutation: UseMutationResult<void, Error, UpdateTask, unknown>
  deleteTaskMutation: UseMutationResult<void, Error, number, unknown>
  projectId: string
  comments?: number
  listId?: string
  disableNavigation?: boolean
  subTaskCount?: number
}

const Task = ({
  task,
  addTaskMutation,
  deleteTaskMutation,
  projectId,
  variant = "backlog",
  listId,
  comments = -1,
  disableNavigation = false,
  subTaskCount = 0,
}: Props) => {
  const [assignees, sprints] = useRealtimeStore(useShallow((state) => [state.assignees, state.sprints]))

  const addPoints = usePointStore((state) => state.addPoints)

  useEffect(() => {
    if (!listId) return
    addPoints(listId, Number.parseInt(task.points))
    return () => {
      addPoints(listId, -Number.parseInt(task.points))
    }
  }, [listId, task.points])

  const defaultValues = useMemo(() => {
    return {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      type: task.type,
      assignee: task.assignee ? task.assignee : "unassigned",
      points: task.points,
      sprintId: String(task.sprintId),
      projectId: Number.parseInt(projectId),
      backlogOrder: task.backlogOrder,
      subTask: task.subTask ?? "",
    }
  }, [JSON.stringify(task)])

  const form = useForm<TaskFormType>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues])

  function onSubmit(newTask: TaskFormType) {
    newTask.projectId = task.projectId
    const changes = Object.keys(newTask).reduce((acc, key) => {
      if (newTask[key as keyof TaskFormType] !== task[key as keyof TaskType]) {
        return { ...acc, [key]: newTask[key as keyof TaskFormType] }
      }
      return acc
    }, {})

    if (Object.keys(changes).length === 0) return

    addTaskMutation.mutate({
      id: task.id,
      newTask: {
        ...changes,
        ...newTask,
      },
    })
  }

  const isSubTask = task.subTask && task.subTask !== ""

  const renderProperties = useCallback(() => {
    if (!variant) return null

    return orders[variant].map((group, groupIdx) => (
      <div
        key={groupIdx}
        className={cn({
          "flex flex-shrink items-center gap-2 text-foreground first:min-w-0 first:flex-grow first:pl-4 last:pr-4":
            variant === "backlog",
          "flex w-full flex-col gap-2": variant === "list",
        })}
      >
        {group.map((item, idx) => {
          if (item.key === "comments") {
            return (
              <div key={idx} className="flex items-center px-2 text-xs text-muted-foreground">
                {comments > 0 && (
                  <>
                    <MessageCircle className="mr-1 h-4 w-4" />
                    {comments}
                  </>
                )}
              </div>
            )
          }

          if (item.key === "subtask-indicator") {
            return (
              <div key={idx} className="flex items-center px-2 text-xs text-muted-foreground">
                {subTaskCount > 0 && (
                  <>
                    <Layers className="mr-1 h-4 w-4" />
                    {subTaskCount}
                  </>
                )}
                {isSubTask && <div className="ml-1 text-xs text-blue-600 dark:text-blue-400">Sub</div>}
              </div>
            )
          }

          const config = getPropertyConfig(item.key, assignees, sprints)

          return (
            <Property key={idx} config={config} form={form} onSubmit={onSubmit} variant={variant} size={item.size} />
          )
        })}
      </div>
    ))
  }, [JSON.stringify(task), variant, assignees, sprints, comments, subTaskCount, isSubTask])

  const router = useRouter()
  useRegisterCommands([
    {
      id: task.id + "open",
      label: task.title,
      icon: (
        <>
          {getEnumOptionByKey(task.status) ? (
            <PropertyBadge option={getEnumOptionByKey(task.status) as Option<string>} size="iconXs" />
          ) : null}
        </>
      ),
      priority: 0,
      action: () => {
        router.push(`/project/${task.projectId}/task/${task.id}`)
      },
      shortcut: [],
      group: "Tasks",
    },
  ])

  if (variant === "list") {
    return <div className={taskVariants({ variant: variant })}>{renderProperties()}</div>
  }

  return (
    <TaskDropDownMenu deleteTaskMutation={deleteTaskMutation} task={task} onSubmit={onSubmit}>
      <Link href={disableNavigation ? "" : `/project/${projectId}/task/${task.id}`} prefetch>
        <div
          className={cn(taskVariants({ variant: variant }), {
            "bg-blue-50 dark:bg-blue-950/20 border-l-2 border-blue-500": isSubTask,
          })}
        >
          {renderProperties()}
        </div>
      </Link>
    </TaskDropDownMenu>
  )
}

export default Task
