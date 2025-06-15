"use client"

import type React from "react"

import { Providers } from "./providers"


export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
