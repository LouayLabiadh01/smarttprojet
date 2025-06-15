/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// user-actions.tsx

"use server";
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

interface UpdateUserData {
  username: string
  profilePicture: string
  role: string
}

export async function addUserToProject(
	userId: string,
	projectId: number,
	role: "owner" | "member" = "member",
) {
	const response = await fetch(`${process.env.DJANGO_API_URL}/api/projects/add_user/`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			user_id: userId,
			project_id: projectId,
			role,
		}),
	});

	if (!response.ok) {
		const data = await response.json();
		throw new Error(data.message || "Failed to add user to project");
	}
}


export async function getUser(userId: string) {
	const response = await fetch(`${process.env.DJANGO_API_URL}/users/api/${userId}/`);

	if (!response.ok) {
		throw new Error("Failed to fetch user");
	}

	const data = await response.json();
	return data;
}

async function handleApiResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

// Helper function to make authenticated requests
async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${process.env.DJANGO_API_URL}${endpoint}`

  const defaultHeaders = {
    "Content-Type": "application/json",
    // Add authentication headers if needed
    // 'Authorization': `Bearer ${token}`,
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  return handleApiResponse(response)
}

export async function getUsers(): Promise<User[]> {
  try {
    const data = await makeApiRequest(`/users/`)

    // Transform Django response to match our User interface
    return data.map((user: any) => ({
      id: user.user_id,
      user_id: user.user_id,
      username: user.username || "Unknown User",
      profilePicture: user.profilePicture || "/placeholder.svg?height=32&width=32",
      role: user.role || "Membre",
      createdAt: new Date().toISOString().split("T")[0], // Since your model doesn't have created_at
    }))
  } catch (error) {
    console.error("Error fetching users:", error)
    throw new Error("Failed to fetch users from Django backend")
  }
}

export async function getUserById(userId: string): Promise<User> {
  try {
    const data = await makeApiRequest(`/users/api/${userId}/`)

    return {
      id: data.user_id,
      user_id: data.user_id,
      username: data.username || "Unknown User",
      profilePicture: data.profilePicture || "/placeholder.svg?height=32&width=32",
      role: data.role || "Membre",
      createdAt: new Date().toISOString().split("T")[0],
    }
  } catch (error) {
    console.error("Error fetching user:", error)
    throw new Error("Failed to fetch user from Django backend")
  }
}

export async function createUser(userData: CreateUserData): Promise<User> {
  try {
    // Transform our data to match Django's expected format
    const djangoUserData = {
      user_id: userData.user_id,
      username: userData.username,
      profilePicture: userData.profilePicture,
      role: userData.role,
    }

    const data = await makeApiRequest("/users/create/", {
      method: "POST",
      body: JSON.stringify(djangoUserData),
    })

    return {
      id: data.user_id,
      user_id: data.user_id,
      username: data.username || "Unknown User",
      profilePicture: data.profilePicture || "/placeholder.svg?height=32&width=32",
      role: data.role || "Membre",
      createdAt: new Date().toISOString().split("T")[0],
    }
  } catch (error) {
    console.error("Error creating user:", error)
    throw new Error("Failed to create user in Django backend")
  }
}

export async function updateUser(userId: string, userData: UpdateUserData): Promise<User> {
  try {
    // Transform our data to match Django's expected format
    const djangoUserData = {
      username: userData.username,
      profilePicture: userData.profilePicture,
      role: userData.role,
    }

    const data = await makeApiRequest(`/users/${userId}/update/`, {
      method: "PUT",
      body: JSON.stringify(djangoUserData),
    })

    return {
      id: data.user_id,
      user_id: data.user_id,
      username: data.username || "Unknown User",
      profilePicture: data.profilePicture || "/placeholder.svg?height=32&width=32",
      role: data.role || "Membre",
      createdAt: new Date().toISOString().split("T")[0],
    }
  } catch (error) {
    console.error("Error updating user:", error)
    throw new Error("Failed to update user in Django backend")
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await makeApiRequest(`/users/${userId}/delete/`, {
      method: "DELETE",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    throw new Error("Failed to delete user from Django backend")
  }
}

export async function updateUserRole(userId: string, role: string): Promise<User> {
  try {
    const data = await makeApiRequest(`/users/${userId}/role/`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    })

    return {
      id: data.user_id,
      user_id: data.user_id,
      username: data.username || "Unknown User",
      profilePicture: data.profilePicture || "/placeholder.svg?height=32&width=32",
      role: data.role || "Membre",
      createdAt: new Date().toISOString().split("T")[0],
    }
  } catch (error) {
    console.error("Error updating user role:", error)
    throw new Error("Failed to update user role in Django backend")
  }
}

// Get available roles (you can customize this based on your needs)
export async function getAvailableRoles(): Promise<string[]> {
  // You can either hardcode these or fetch from your Django backend
  return ["Membre", "Admin", "Moderator", "Editor"]
}
