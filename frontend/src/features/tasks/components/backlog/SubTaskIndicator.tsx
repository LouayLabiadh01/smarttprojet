/* eslint-disable import/order */
"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "~/components/ui/button"

interface SubTaskIndicatorProps {
  hasSubTasks: boolean
  isExpanded: boolean
  onToggle: () => void
  level: number
}

export default function SubTaskIndicator({ hasSubTasks, isExpanded, onToggle, level }: SubTaskIndicatorProps) {
  if (!hasSubTasks) {
    return <div className="w-6" style={{ marginLeft: `${level * 20}px` }} />
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="h-6 w-6 p-0"
      style={{ marginLeft: `${level * 20}px` }}
    >
      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </Button>
  )
}
