/* eslint-disable import/order */
"use client"

// Ce fichier n'est plus utilisé directement, nous utilisons recharts directement
// Mais nous le gardons pour référence ou utilisation future

import type React from "react"
import type { TooltipProps } from "recharts"

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import type { ReactElement } from "react"

export const Chart = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const ChartContainer = ({ children }: { children: ReactElement }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      {children}
    </ResponsiveContainer>
  )
}

export const ChartPie = ({ data }: { data: { name: string; value: number; fill: string }[] }) => {
  return (
    <PieChart>
      <Pie
        dataKey="value"
        isAnimationActive={false}
        data={data}
        cx="50%"
        cy="50%"
        outerRadius={80}
        fill="#8884d8"
        label
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.fill} />
        ))}
      </Pie>
    </PieChart>
  )
}

export const ChartLegend = () => {
  return <Legend />
}

export const ChartTooltip = ({ content }: { content: TooltipProps<number, string>["content"] }) => {
  return <Tooltip content={content} />
}

export const ChartTooltipContent = () => {
  return (
    <div className="p-2 bg-white border rounded shadow-md">
      <p className="font-bold text-gray-800">{`Value: `}</p>
    </div>
  )
}

export const ChartBar = ({ data }: { data: { name: string; value: number }[] }) => {
  return (
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="value" fill="#8884d8" />
    </BarChart>
  )
}

export const ChartGrid = () => {
  return <></>
}
