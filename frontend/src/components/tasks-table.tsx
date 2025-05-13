/* eslint-disable import/order */
"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Search } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"

interface User {
  id: number
  username: string
  profilePicture?: string
}

interface Task {
  id: string
  title: string
  status: "todo" | "inprogress" | "done" | "backlog" | "inreview"
  assignee?: User
}

interface Project {
  id: number
  name: string
  tasks: Task[]
}

const statusMap = {
  backlog: { label: "Backlog", variant: "outline" as const },
  todo: { label: "À faire", variant: "outline" as const },
  inprogress: { label: "En cours", variant: "secondary" as const },
  inreview: { label: "En révision", variant: "secondary" as const },
  done: { label: "Terminé", variant: "default" as const },
}

interface TasksTableProps {
  project: Project
}

export default function TasksTable({ project }: TasksTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "title",
      header: "Titre",
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof statusMap
        return <Badge variant={statusMap[status].variant}>{statusMap[status].label}</Badge>
      },
    },
    {
      accessorKey: "assignee",
      header: "Assigné à",
      cell: ({ row }) => {
        console.log(row)
        const assignee = row.original.assignee
        if (!assignee) return <span className="text-muted-foreground">Non assigné</span>

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={assignee.profilePicture ?? "/placeholder.svg"} alt={assignee.username} />
              <AvatarFallback>{assignee.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{assignee.username}</span>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: project.tasks,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tâches du Projet</CardTitle>
        <CardDescription>Liste des tâches du projet</CardDescription>
        <div className="flex items-center py-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des tâches..."
              value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Aucune tâche trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
