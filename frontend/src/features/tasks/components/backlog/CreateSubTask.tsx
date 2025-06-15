/* eslint-disable import/order */
import type React from "react"
import { Plus } from "lucide-react"
import { Button } from "~/components/ui/button"
import SimpleTooltip from "~/components/SimpleTooltip"
import CreateTask from "~/features/tasks/components/CreateTask"

interface CreateSubTaskProps {
  parentTaskId: number
  projectId: string
  children?: React.ReactNode
}

export default function CreateSubTask({ parentTaskId, projectId, children }: CreateSubTaskProps) {
  return (
    <CreateTask
      projectId={projectId}
      overrideDefaultValues={{
        subTask: parentTaskId.toString(),
      }}
    >
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
            <Plus className="h-3 w-3" />
          </Button>
    </CreateTask>
  )
}
