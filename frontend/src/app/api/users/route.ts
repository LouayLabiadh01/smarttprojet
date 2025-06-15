/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable import/order */
import { type NextRequest, NextResponse } from "next/server"
import { getUsers, createUser } from "~/actions/user-actions"

export async function GET() {
  try {
    const users = await getUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    const newUser = await createUser(userData)
    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
