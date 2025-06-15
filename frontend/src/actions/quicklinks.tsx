/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server"

import { authenticate } from "./security/authenticate"

type Quicklink = {
  id: string // UUID string
  title: string
  url: string
  created_at: string
  user: string // Required user field
}

export async function getQuicklinks(): Promise<Quicklink[]> {
  try {
    const userId = await authenticate()

    const response = await fetch(`${process.env.DJANGO_API_URL}/archives/quicklinks/?user=${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch quicklinks: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching quicklinks:", error)
    return []
  }
}

export async function createQuicklink(quicklink: { title: string; url: string }): Promise<Quicklink | null> {
  try {
    const userId = await authenticate()

    const response = await fetch(`${process.env.DJANGO_API_URL}/archives/quicklinks/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      body: JSON.stringify({
        ...quicklink,
        user: userId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create quicklink: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error creating quicklink:", error)
    return null
  }
}

export async function deleteQuicklink(id: string): Promise<boolean> {
  try {
    const userId = await authenticate()

    const response = await fetch(`${process.env.DJANGO_API_URL}/archives/quicklinks/${id}/?user=${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete quicklink: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error("Error deleting quicklink:", error)
    return false
  }
}
