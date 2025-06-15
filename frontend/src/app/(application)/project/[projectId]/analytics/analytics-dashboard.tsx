/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Input } from "~/components/ui/input"
import { BarChart3, Search, Folder, Loader2 } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { getAnalyticsData } from "~/actions/analytics-actions"
import PageHeader from "~/components/layout/PageHeader"

interface AnalyticsData {
  totalUsers: number
  totalAdmins: number
  totalMembers: number
  totalGuests: number
  totalProjects: number
  totalWorkItems: number
  totalCompleted: number
  totalIncomplete: number
  workItemsByStatus: {
    total: number
    backlog: number
    todo: number
    inprogress: number
    inreview: number
    done: number
  }
  taskCreationTrend: Array<{
    date: string
    created: number
    resolved: number
  }>
  projectInsights: Array<{
    subject: string
    value: number
  }>
  activeProjects: Array<{
    id: number
    name: string
    completionRate: number
    color: string
  }>
}

export default function Component() {
  const [activeTab, setActiveTab] = useState("overview")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState("all-projects")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const projectId = selectedProject === "all-projects" ? undefined : selectedProject
        const data = await getAnalyticsData(projectId)
        setAnalyticsData(data)
        setError(null)
      } catch (err) {
        setError("Failed to load analytics data")
        console.error("Analytics error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedProject])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-[#e5e7eb] font-sans flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error ?? !analyticsData) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-[#e5e7eb] font-sans flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error ?? "Failed to load data"}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded hover:bg-[#2a2a2a]"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const projectSummaryData = [
    { name: "Work Items", value: analyticsData.totalWorkItems },
    { name: "Completed", value: analyticsData.totalCompleted },
    { name: "Incomplete", value: analyticsData.totalIncomplete },
    { name: "Members", value: analyticsData.totalMembers },
    { name: "Projects", value: analyticsData.totalProjects },
  ]

  const filteredProjects = analyticsData.activeProjects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e5e7eb] font-sans">
      {/* Header */}
      <PageHeader breadCrumbs></PageHeader>
      <div className="border-b border-[#2a2a2a] p-4 bg-[#0a0a0a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#e5e7eb]" />
            <h1 className="text-lg font-medium text-[#e5e7eb]">Analytics</h1>
          </div>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48 bg-[#1a1a1a] border-[#2a2a2a] text-[#e5e7eb]">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <SelectItem value="all-projects" className="text-[#e5e7eb] focus:bg-[#2a2a2a]">
                All projects
              </SelectItem>
              {analyticsData.activeProjects.map((project) => (
                <SelectItem
                  key={project.id}
                  value={project.id.toString()}
                  className="text-[#e5e7eb] focus:bg-[#2a2a2a]"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#2a2a2a] px-4 bg-[#0a0a0a]">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-4 text-sm font-normal border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-[#e5e7eb] text-[#e5e7eb]"
                : "border-transparent text-[#6b7280] hover:text-[#e5e7eb]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("work-items")}
            className={`py-4 text-sm font-normal border-b-2 transition-colors ${
              activeTab === "work-items"
                ? "border-[#e5e7eb] text-[#e5e7eb]"
                : "border-transparent text-[#6b7280] hover:text-[#e5e7eb]"
            }`}
          >
            Work items
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <div className="space-y-8">
            <h2 className="text-xl font-medium text-[#e5e7eb]">Overview</h2>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-6">
                  <div className="text-sm text-[#6b7280] mb-2">Total Users</div>
                  <div className="text-3xl font-bold text-[#e5e7eb]">{analyticsData.totalUsers}</div>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-6">
                  <div className="text-sm text-[#6b7280] mb-2">Total Admins</div>
                  <div className="text-3xl font-bold text-[#e5e7eb]">{analyticsData.totalAdmins}</div>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-6">
                  <div className="text-sm text-[#6b7280] mb-2">Total members</div>
                  <div className="text-3xl font-bold text-[#e5e7eb]">{analyticsData.totalMembers}</div>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-6">
                  <div className="text-sm text-[#6b7280] mb-2">Total Guests</div>
                  <div className="text-3xl font-bold text-[#e5e7eb]">{analyticsData.totalGuests}</div>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-6">
                  <div className="text-sm text-[#6b7280] mb-2">Total Projects</div>
                  <div className="text-3xl font-bold text-[#e5e7eb]">{analyticsData.totalProjects}</div>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-6">
                  <div className="text-sm text-[#6b7280] mb-2">Total work items</div>
                  <div className="text-3xl font-bold text-[#e5e7eb]">{analyticsData.totalWorkItems}</div>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-6">
                  <div className="text-sm text-[#6b7280] mb-2">Total Completed</div>
                  <div className="text-3xl font-bold text-[#e5e7eb]">{analyticsData.totalCompleted}</div>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-6">
                  <div className="text-sm text-[#6b7280] mb-2">Total Incomplete</div>
                  <div className="text-3xl font-bold text-[#e5e7eb]">{analyticsData.totalIncomplete}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Project Insights */}
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="text-[#e5e7eb] font-medium">Project Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={analyticsData.projectInsights}>
                        <PolarGrid stroke="#2a2a2a" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 12 }} />
                        <PolarRadiusAxis tick={false} />
                        <Radar
                          name="Metrics"
                          dataKey="value"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Active Projects */}
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="text-[#e5e7eb] font-medium">Active Projects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.slice(0, 5).map((project) => (
                      <div key={project.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#e5e7eb]">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                          <span>{project.name}</span>
                        </div>
                        <Badge
                          className={`${
                            project.completionRate < 25
                              ? "bg-red-600 hover:bg-red-700"
                              : project.completionRate < 75
                                ? "bg-yellow-600 hover:bg-yellow-700"
                                : "bg-green-600 hover:bg-green-700"
                          } text-white`}
                        >
                          {project.completionRate}%
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-[#6b7280] text-center py-4">No active projects</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary Table */}
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#e5e7eb] font-medium">Summary of Projects</CardTitle>
                    <div className="text-sm text-[#6b7280] mt-1">All Projects</div>
                  </div>
                  <div className="text-sm text-[#6b7280]">Trend on charts</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectSummaryData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <span className="text-[#e5e7eb]">{item.name}</span>
                      <span className="font-mono text-[#e5e7eb]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "work-items" && (
          <div className="space-y-8">
            <h2 className="text-xl font-medium text-[#e5e7eb]">Work Items</h2>

            {/* Work Items Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-6">
                  <div className="text-sm text-[#6b7280] mb-2">Total work items</div>
                  <div className="text-3xl font-bold text-[#e5e7eb]">{analyticsData.workItemsByStatus.total}</div>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-6">
                  <div className="text-sm text-[#6b7280] mb-2">Started work items</div>
                  <div className="text-3xl font-bold text-[#e5e7eb]">
                    {analyticsData.workItemsByStatus.inprogress + analyticsData.workItemsByStatus.inreview}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-6">
                  <div className="text-sm text-[#6b7280] mb-2">Backlog work items</div>
                  <div className="text-3xl font-bold text-[#e5e7eb]">{analyticsData.workItemsByStatus.backlog}</div>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-6">
                  <div className="text-sm text-[#6b7280] mb-2">Unstarted work items</div>
                  <div className="text-3xl font-bold text-[#e5e7eb]">{analyticsData.workItemsByStatus.todo}</div>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardContent className="p-6">
                  <div className="text-sm text-[#6b7280] mb-2">Completed work items</div>
                  <div className="text-3xl font-bold text-[#e5e7eb]">{analyticsData.workItemsByStatus.done}</div>
                </CardContent>
              </Card>
            </div>

            {/* Created vs Resolved Chart */}
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="text-[#e5e7eb] font-medium">Created vs Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.taskCreationTrend}>
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                        label={{
                          value: "NUMBER OF ISSUES",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fill: "#6b7280", fontSize: 12 },
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="created"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                        name="Created"
                      />
                      <Line
                        type="monotone"
                        dataKey="resolved"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                        name="Resolved"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#10b981] rounded-full"></div>
                    <span className="text-sm text-[#6b7280]">Resolved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#3b82f6] rounded-full"></div>
                    <span className="text-sm text-[#6b7280]">Created</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
