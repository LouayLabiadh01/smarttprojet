/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable import/order */
"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"

interface Project {
  id: number
  name: string
  description?: string
  color: string
  sprint_duration: number
  sprint_start: string
  image?: string
  is_ai_enabled: boolean
  is_archived: boolean
  tasks_summary: {
    total: number
    done: number
    in_progress: number
  }
  charts: {
    by_week: { name: string; value: number }[]
    by_sprint: { name: string; value: number }[]
    status: { name: string; value: number }[]
  }
}

interface ProjectChartsProps {
  project: Project
}

const COLORS = ["#f97316", "#3b82f6", "#22c55e"]

export default function ProjectCharts({ project }: ProjectChartsProps) {
  const { status: statusData, by_sprint: sprintData, by_week: weekData } = project.charts

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Répartition des Tâches</CardTitle>
          <CardDescription>Par statut</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} tâches`, "Quantité"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tâches Complétées</CardTitle>
          <CardDescription>Progression dans le temps</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sprint">
            <TabsList className="mb-4">
              <TabsTrigger value="sprint">Par Sprint</TabsTrigger>
              <TabsTrigger value="week">Par Semaine</TabsTrigger>
            </TabsList>
            <TabsContent value="sprint" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sprintData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} tâches`, "Complétées"]} />
                  <Legend />
                  <Bar dataKey="value" name="Tâches complétées" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="week" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} tâches`, "Complétées"]} />
                  <Legend />
                  <Bar dataKey="value" name="Tâches complétées" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
