/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable import/order */
"use client"

import { useState, useEffect } from "react"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Search, Trash2, UserPlus, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { getUsers, createUser, updateUser, deleteUser, getAvailableRoles } from "~/actions/user-actions"
import PageHeader from "~/components/layout/PageHeader"

interface User {
  id: string
  user_id: string
  username: string
  profilePicture: string
  role: string
  createdAt?: string
}

interface CreateUserData {
  user_id: string
  username: string
  profilePicture: string
  role: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [newUser, setNewUser] = useState<CreateUserData>({
    user_id: "",
    username: "",
    profilePicture: "/placeholder.svg?height=32&width=32",
    role: "Membre",
  })
  const [submitting, setSubmitting] = useState(false)

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      user.user_id.toLowerCase().includes(searchTerm.toLowerCase().trim()),
  )

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const fetchedUsers = await getUsers()
      setUsers(fetchedUsers)
    } catch (error) {
      toast.error("Failed to fetch users. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const roles = await getAvailableRoles()
      setAvailableRoles(roles)
    } catch (error) {
      console.error("Failed to fetch roles:", error)
      setAvailableRoles(["Membre", "Admin", "Chef"])
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const handleAddUser = async () => {
    if (!newUser.user_id || !newUser.username) return

    try {
      setSubmitting(true)
      const createdUser = await createUser(newUser)
      setUsers([...users, createdUser])
      setNewUser({ user_id: "", username: "", profilePicture: "/placeholder.svg?height=32&width=32", role: "Membre" })
      setIsAddDialogOpen(false)
      toast.success("User created successfully.")
    } catch (error) {
      toast.error("Failed to create user. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return

    try {
      setSubmitting(true)
      const updatedUser = await updateUser(editingUser.user_id, {
        username: editingUser.username,
        profilePicture: editingUser.profilePicture,
        role: editingUser.role,
      })
      setUsers(users.map((user) => (user.user_id === editingUser.user_id ? updatedUser : user)))
      setIsEditDialogOpen(false)
      setEditingUser(null)
      toast.success("User updated successfully.")
    } catch (error) {
      toast.error("Failed to update user. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId)
      setUsers(users.filter((user) => user.user_id !== userId))
      toast.success("User deleted successfully.")
    } catch (error) {
      toast.error("Failed to delete user. Please try again.")
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    const user = users.find((u) => u.user_id === userId)
    if (!user) return

    try {
      const updatedUser = await updateUser(userId, {
        username: user.username,
        profilePicture: user.profilePicture,
        role: newRole,
      })
      setUsers(users.map((u) => (u.user_id === userId ? updatedUser : u)))
      toast.success("User role updated successfully.")
    } catch (error) {
      toast.error("Failed to update user role. Please try again.")
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser({ ...user })
    setIsEditDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading users...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
    <PageHeader breadCrumbs></PageHeader>
    <div className="container mx-auto mt-2 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage your users and their roles</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchUsers} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new user account with the specified details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="user_id">User ID</Label>
                  <Input
                    id="user_id"
                    value={newUser.user_id}
                    onChange={(e) => setNewUser({ ...newUser, user_id: e.target.value })}
                    placeholder="Enter unique user ID"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="Enter username"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profilePicture">Profile Picture URL</Label>
                  <Input
                    id="profilePicture"
                    value={newUser.profilePicture}
                    onChange={(e) => setNewUser({ ...newUser, profilePicture: e.target.value })}
                    placeholder="Enter profile picture URL"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: string) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} disabled={!newUser.user_id || !newUser.username || submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredUsers.length} of {users.length} users
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profilePicture || "/placeholder.svg"} alt={user.username} />
                      <AvatarFallback>
                        {user.username
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.username}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{user.user_id}</code>
                </TableCell>
                <TableCell>
                  <Select value={user.role} onValueChange={(value: string) => handleRoleChange(user.user_id, value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => openEditDialog(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the user account for{" "}
                              {user.username}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.user_id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "No users found matching your search." : "No users found."}
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update the user's information and settings.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-profilePicture">Profile Picture URL</Label>
                <Input
                  id="edit-profilePicture"
                  value={editingUser.profilePicture}
                  onChange={(e) => setEditingUser({ ...editingUser, profilePicture: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value: string) => setEditingUser({ ...editingUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  )
}
