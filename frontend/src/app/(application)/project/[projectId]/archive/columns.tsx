/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/consistent-type-imports */
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown} from "lucide-react"
import { Button } from "~/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Checkbox } from "~/components/ui/checkbox"

export type Project = {
  id: number;
  name: string;
  sprint_duration: number;
  sprint_start: string;
  description?: string;
  color?: string;
  is_archived: boolean;
  date_archivage?: string;
}


export const columns: ColumnDef<Project>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "sprint_duration",
    header: () => <div className="text-right">Sprint Duration (weeks)</div>,
    cell: ({ row }) => {
      const duration = row.getValue("sprint_duration") as number
      return <div className="text-right">{duration}</div>
    },
  },
  {
    accessorKey: "sprint_start",
    header: "Sprint Start",
    cell: ({ row }) => {
      const date = new Date(row.getValue("sprint_start"))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="truncate max-w-[200px]">
        {row.getValue("description") ?? "—"}
      </div>
    ),
  },
  {
    accessorKey: "color",
    header: "Color",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: row.getValue("color") }}
        />
        <span>{row.getValue("color")}</span>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const project = row.original

      const unarchiveProject = async (id: number) => {
        try {
          const response = await fetch(`http://localhost:8000/api/projects/${id}/unarchive/`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ is_archived: false }),
          });

          if (!response.ok) {
            throw new Error("Failed to unarchive project");
          }

          // ✅ Refresh or trigger state update if needed
          window.location.reload(); // Or use router.refresh() if you're in App Router
        } catch (error) {
          console.error("Error unarchiving project:", error);
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(project.name)}
            >
              Copy project name
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => unarchiveProject(project.id)}>
              Désarchiver
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
