/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import { useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { InfoCircledIcon } from "@radix-ui/react-icons"
import { ChevronRight, Loader2, Sparkle, Layers } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { useShallow } from "zustand/react/shallow"

import { getCurrentSprintForProject } from "~/actions/sprint-actions"
import { createTask } from "~/actions/task-actions"
import Message from "~/components/Message"
import SimpleTooltip from "~/components/SimpleTooltip"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { Form, FormField, FormItem, FormMessage, FormLabel } from "~/components/ui/form"
import { Textarea } from "~/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { aiGenerateTask, aiGenerateSubTasks } from "~/features/ai/actions/ai-action"
import { AIDAILYLIMIT, timeTillNextReset } from "~/features/ai/utils/aiLimit"
import { useRegisterCommands } from "~/features/cmd-menu/registerCommands"
import { taskNameToBranchName } from "~/features/tasks/utils/task-name-branch-converters"
import { useRealtimeStore } from "~/store/realtime"
import { useUserStore } from "~/store/user"

type Props = {
  projectId: string
  mode?: "tasks" | "subtasks"
}

const formSchema = z.object({
  description: z.string().max(1000).min(1, "Description is required"),
  mode: z.enum(["tasks", "subtasks"]),
  maxSubTasks: z.number().min(1).max(10).optional(),
})

const AiDialog = ({ projectId, mode = "tasks" }: Props) => {
  const [open, setOpen] = useState(false)
  const [project, assignees] = useRealtimeStore(useShallow((state) => [state.project, state.assignees]))
  const aiUsageCount = useUserStore((state) => state.aiUsageCount)

  useRegisterCommands([
    {
      id: "ai-task-creation",
      label: "AI Task Creation",
      icon: <Sparkle className="h-4 w-4" />,
      priority: 4,
      shortcut: [],
      action: () => {
        setOpen(true)
      },
    },
  ])

  function resetForm() {
    form.reset({
      description: "",
      mode: mode,
      maxSubTasks: 5,
    })
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      mode: mode,
      maxSubTasks: 5,
    },
  })

  const selectedMode = form.watch("mode")

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.mode === "subtasks") {
      await handleSubTaskGeneration(values)
    } else {
      await handleTaskGeneration(values)
    }
  }

  async function handleTaskGeneration(values: z.infer<typeof formSchema>) {
    const response = await aiGenerateTask(values.description, Number.parseInt(projectId), assignees)

    if ((!response.success || response.error) ?? !response.tasks) {
      if (response.error === "Limite d'utilisation AI atteinte") {
        toast.error(`AI daily limit reached. Please try again in ${timeTillNextReset()} hours.`)
      }

      toast.error(response.error)
      return
    }

    const currentSprint = await getCurrentSprintForProject(Number.parseInt(projectId))

    const createTasksPromises = response.tasks.map((task) =>
      createTask({
        ...task,
        priority: normalizePriority(task.priority),
        type: normalizeType(task.type),
        status: normalizeStatus(task.status),
        points: normalizePoints(task.points),
        title: task.title,
        projectId: Number.parseInt(projectId),
        backlogOrder: 1000000,
        insertedDate: new Date(),
        lastEditedAt: null,
        branchName: taskNameToBranchName(task.title),
        sprintId: currentSprint ? String(currentSprint.id) : "-1",
        subTask: "",
      }),
    )

    await processTaskCreation(createTasksPromises, "tasks")
  }

  async function handleSubTaskGeneration(values: z.infer<typeof formSchema>) {
    const response = await aiGenerateSubTasks(
      values.description,
      Number.parseInt(projectId),
      assignees,
      values.maxSubTasks ?? 5,
    )

    if (response.error ?? !response.subtasks) {
      if (response.error === "Limite d'utilisation AI atteinte") {
        toast.error(`AI daily limit reached. Please try again in ${timeTillNextReset()} hours.`)
      }

      toast.error(response.error ?? "Failed to generate subtasks")
      return
    }

    const currentSprint = await getCurrentSprintForProject(Number.parseInt(projectId))

    const createSubTasksPromises = response.subtasks.map((subtask) =>
      createTask({
        ...subtask,
        priority: normalizePriority(subtask.priority),
        type: normalizeType(subtask.type),
        status: normalizeStatus(subtask.status),
        points: normalizePoints(subtask.points),
        title: subtask.title,
        projectId: Number.parseInt(projectId),
        backlogOrder: 1000000,
        insertedDate: new Date(),
        lastEditedAt: null,
        branchName: taskNameToBranchName(subtask.title),
        sprintId: currentSprint ? String(currentSprint.id) : "-1",
        subTask: "", // Generated as independent subtasks, not linked to specific parent
      }),
    )

    await processTaskCreation(createSubTasksPromises, "subtasks")
  }

  async function processTaskCreation(promises: Promise<any>[], type: "tasks" | "subtasks") {
    const results = await Promise.allSettled(promises)

    const addedIds: number[] = []
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(`${type} ${index} created successfully:`, result.value)
        if (result.value) {
          addedIds.push(result.value.id)
        }
      } else {
        console.error(`${type} ${index} failed to create:`, result.reason)
      }
    })

    if (addedIds.length === 0) {
      toast.error(`Something went wrong while creating AI ${type}`)
    } else {
      toast.success(`AI created ${addedIds.length} ${type}`)
    }

    resetForm()
    setOpen(false)
  }

  function normalizeStatus(status: string): "backlog" | "todo" | "inprogress" | "inreview" | "done" {
    switch (status.toLowerCase()) {
      case "backlog":
      case "todo":
      case "inprogress":
      case "inreview":
      case "done":
        return status.toLowerCase() as any
      default:
        return "backlog"
    }
  }

  function normalizePoints(points: number): "0" | "1" | "2" | "3" | "4" | "5" {
    const safe = Math.max(0, Math.min(5, points))
    return String(safe) as "0" | "1" | "2" | "3" | "4" | "5"
  }

  function normalizeType(type: string): "task" | "bug" | "feature" | "improvement" | "research" | "testing" {
    const allowedTypes = ["task", "bug", "feature", "improvement", "research", "testing"] as const
    return allowedTypes.includes(type as any) ? (type as (typeof allowedTypes)[number]) : "task"
  }

  function normalizePriority(priority: string): "none" | "low" | "medium" | "high" | "critical" {
    const allowed = ["none", "low", "medium", "high", "critical"] as const
    return allowed.includes(priority as any) ? (priority as (typeof allowed)[number]) : "none"
  }

  if (project?.is_ai_enabled === false) {
    return null
  }

  const dialogTitle = selectedMode === "subtasks" ? "AI SubTask Creator" : "AI Task Creator"
  const dialogIcon = selectedMode === "subtasks" ? <Layers className="h-4 w-4" /> : <Sparkle className="h-4 w-4" />

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(open: boolean) => {
          if (!open) {
            resetForm()
          }
          setOpen(open)
        }}
      >
        <SimpleTooltip label="AI Task Creator">
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-[36px] rounded-xl bg-background-dialog">
              <Sparkle className="h-4 w-4" />
              <span className="sr-only">Open AI Task Creator</span>
            </Button>
          </DialogTrigger>
        </SimpleTooltip>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogIcon}
              {dialogTitle}
            </DialogTitle>
            {aiUsageCount >= AIDAILYLIMIT && (
              <Message type="error" className="mt-2 w-full flex-shrink">
                You have reached the daily AI limit. <br />
                Your usage will reset in {timeTillNextReset()} hours.
              </Message>
            )}
          </DialogHeader>
          {aiUsageCount < AIDAILYLIMIT && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Generation Mode</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select generation mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tasks">
                            <div className="flex items-center gap-2">
                              <Sparkle className="h-4 w-4" />
                              Generate Tasks
                            </div>
                          </SelectItem>
                          <SelectItem value="subtasks">
                            <div className="flex items-center gap-2">
                              <Layers className="h-4 w-4" />
                              Generate SubTasks
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedMode === "subtasks" && (
                  <FormField
                    control={form.control}
                    name="maxSubTasks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum SubTasks</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number.parseInt(value))}
                          defaultValue={String(field.value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select max subtasks" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <SelectItem key={num} value={String(num)}>
                                {num} SubTask{num > 1 ? "s" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {selectedMode === "subtasks"
                          ? "Describe the subtasks you would like to create..."
                          : "Describe the tasks you would like to create..."}
                      </FormLabel>
                      <Textarea
                        placeholder={
                          selectedMode === "subtasks"
                            ? "Describe the subtasks you would like to create based on existing main tasks..."
                            : "Describe the tasks you would like to create..."
                        }
                        className="h-[150px] max-h-[150px] bg-transparent"
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
          <DialogFooter>
            <SimpleTooltip label={`Resets in ${timeTillNextReset()} hours`}>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <InfoCircledIcon className="h-4 w-4" />
                Daily Usage: {aiUsageCount}/{AIDAILYLIMIT}
              </span>
            </SimpleTooltip>
            <div className="flex-1" />
            <Button
              className="flex items-center gap-2"
              onClick={form.handleSubmit(onSubmit)}
              disabled={
                !form.formState.isValid ||
                !form.formState.isDirty ||
                form.formState.isSubmitting ||
                aiUsageCount >= AIDAILYLIMIT
              }
              variant="secondary"
            >
              {form.formState.isSubmitting
                ? selectedMode === "subtasks"
                  ? "Creating SubTasks"
                  : "Creating Tasks"
                : selectedMode === "subtasks"
                  ? "Create SubTasks"
                  : "Create Tasks"}
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AiDialog
