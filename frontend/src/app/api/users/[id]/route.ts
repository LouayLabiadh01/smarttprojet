/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable import/order */
import { type NextRequest, NextResponse } from "next/server"
import { getUserById, updateUser, deleteUser } from "~/actions/user-actions"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserById(params.id)
    return NextResponse.json(user)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userData = await request.json()
    const updatedUser = await updateUser(params.id, userData)
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteUser(params.id)
    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
