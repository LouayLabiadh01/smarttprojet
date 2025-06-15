/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server"

import { authenticate } from "./security/authenticate"

type ChecklistItem = {
  id: string // UUID string
  text: string
  checked: boolean
  user: string // Required user field
}

type Sticky = {
  id: string // UUID string
  title: string
  content: string
  color: string
  type: "note" | "checklist"
  created_at: string
  user: string // Required user field
  items?: ChecklistItem[]
}

export async function getStickies(): Promise<Sticky[]> {
  try {
    const userId = await authenticate()

    const response = await fetch(`${process.env.DJANGO_API_URL}/archives/stickies/?user=${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch stickies: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching stickies:", error)
    return []
  }
}

export async function createSticky(sticky: Omit<Sticky, "id" | "created_at" | "user">): Promise<Sticky | null> {
  try {
    const userId = await authenticate()

    const response = await fetch(`${process.env.DJANGO_API_URL}/archives/stickies/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      body: JSON.stringify({
        ...sticky,
        user: userId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create sticky: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error creating sticky:", error)
    return null
  }
}

export async function updateSticky(
  id: string,
  updates: Partial<Omit<Sticky, "id" | "created_at" | "user">>,
): Promise<Sticky | null> {
  try {
    const userId = await authenticate()

    const response = await fetch(`${process.env.DJANGO_API_URL}/archives/stickies/${id}/?user=${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error(`Failed to update sticky: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error updating sticky:", error)
    return null
  }
}

export async function deleteSticky(id: string): Promise<boolean> {
  try {
    const userId = await authenticate()

    const response = await fetch(`${process.env.DJANGO_API_URL}/archives/stickies/${id}/delete/?user=${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete sticky: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error("Error deleting sticky:", error)
    return false
  }
}

export async function addChecklistItem(
  stickyId: string,
  item: Omit<ChecklistItem, "id" | "user">,
): Promise<ChecklistItem | null> {
  try {
    const userId = await authenticate()

    const response = await fetch(`${process.env.DJANGO_API_URL}/archives/stickies/${stickyId}/items/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      body: JSON.stringify({
        ...item,
        sticky: stickyId,
        user: userId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to add checklist item: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error adding checklist item:", error)
    return null
  }
}

export async function updateChecklistItem(
  stickyId: string,
  itemId: string,
  updates: Partial<Omit<ChecklistItem, "id" | "user">>,
): Promise<ChecklistItem | null> {
  try {
    const userId = await authenticate()

    const response = await fetch(
      `${process.env.DJANGO_API_URL}/archives/stickies/${stickyId}/items/${itemId}/?user=${userId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.API_TOKEN}`,
        },
        body: JSON.stringify(updates),
      },
    )

    if (!response.ok) {
      throw new Error(`Failed to update checklist item: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error updating checklist item:", error)
    return null
  }
}

export async function deleteChecklistItem(stickyId: string, itemId: string): Promise<boolean> {
  try {
    const userId = await authenticate()

    const response = await fetch(
      `${process.env.DJANGO_API_URL}/archives/stickies/${stickyId}/items/${itemId}/delete/?user=${userId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.API_TOKEN}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Failed to delete checklist item: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error("Error deleting checklist item:", error)
    return false
  }
}
