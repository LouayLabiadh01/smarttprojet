export interface User {
  id: string
  user_id: string
  username: string
  profilePicture: string
  role: string
  createdAt?: string
}

export interface CreateUserData {
  user_id: string
  username: string
  profilePicture: string
  role: string
}

export interface UpdateUserData {
  username: string
  profilePicture: string
  role: string
}

export interface DjangoUser {
  user_id: string
  username: string
  profilePicture: string
  role: string
}