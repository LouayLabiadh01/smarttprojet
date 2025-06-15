/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server"
import { logger } from "~/lib/logger"
import type { User } from "~/schema"
import { getTasksFromProject } from "~/actions/task-actions"
import { isAiLimitReached } from "./ai-limit-actions"

// Définition de la structure des tâches générées
interface Task {
  title: string
  description: string
  status: string
  points: number
  priority: string
  type: string
  assignee: string
  subTask?: string
}

interface ColabResponse {
  tasks: Task[]
}

interface SubTaskColabResponse {
  subtasks: Task[]
}

const COLAB_API_URL = "https://0fc8-34-74-189-110.ngrok-free.app/generate-tasks"
const COLAB_SUBTASK_API_URL = "https://0fc8-34-74-189-110.ngrok-free.app/generate-subtasks"

async function fetchFromColab(data: Record<string, unknown>): Promise<ColabResponse | null> {
  try {
    console.log("🔄 Envoi des données à Colab:", data)

    const response = await fetch(COLAB_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const results = await response.json()
    console.log("✅ Réponse de Colab API:", results)

    const result = results

    if (Array.isArray(result.tasks)) {
      const formattedTasks: Task[] = result.tasks.map(
        (task: {
          Title: any
          Description: any
          Status: any
          Points: any
          Priority: any
          Type: any
          Assignee: any
        }) => ({
          title: task.Title || "",
          description: task.Description || "",
          status: task.Status || "",
          points: task.Points || 0,
          priority: task.Priority || "",
          type: task.Type || "",
          assignee: task.Assignee || "",
        }),
      )

      return { tasks: formattedTasks }
    }

    if (typeof result === "object" && result !== null && "tasks" in result && Array.isArray(result.tasks)) {
      return result as ColabResponse
    } else {
      throw new Error("Format de réponse invalide depuis Colab API")
    }
  } catch (error) {
    logger.error(error, "[AI] Erreur API Colab")
    return null
  }
}

async function fetchSubTasksFromColab(data: Record<string, unknown>): Promise<SubTaskColabResponse | null> {
  try {
    console.log("🔄 Envoi des données pour sous-tâches à Colab:", data)

    const response = await fetch(COLAB_SUBTASK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const results = await response.json()
    console.log("✅ Réponse de Colab API pour sous-tâches:", results)

    const result = results

    if (Array.isArray(result.subtasks)) {
      const formattedSubTasks: Task[] = result.subtasks.map(
        (task: {
          Title: any
          Description: any
          Status: any
          Points: any
          Priority: any
          Type: any
          Assignee: any
        }) => ({
          title: task.Title || "",
          description: task.Description || "",
          status: task.Status || "todo",
          points: task.Points || 1,
          priority: task.Priority || "none",
          type: task.Type || "task",
          assignee: task.Assignee || "",
        }),
      )

      return { subtasks: formattedSubTasks }
    }

    if (typeof result === "object" && result !== null && "subtasks" in result && Array.isArray(result.subtasks)) {
      return result as SubTaskColabResponse
    } else {
      throw new Error("Format de réponse invalide pour les sous-tâches depuis Colab API")
    }
  } catch (error) {
    logger.error(error, "[AI] Erreur API Colab pour sous-tâches")
    return null
  }
}

/**
 * Génère des tâches via l'API Colab
 */
export async function aiGenerateTask(
  description: string,
  projectId: number,
  assignees: User[],
): Promise<{ success: boolean; tasks?: Task[]; error?: string }> {
  try {
    if (description.length === 0) {
      return { success: false, error: "Aucune description fournie" }
    }

    logger.info("[AI] Génération de tâches en cours...")

    if (await isAiLimitReached()) {
      logger.warn("[AI] Limite d'utilisation atteinte")
      return { success: false, error: "Limite d'utilisation AI atteinte" }
    }

    // Récupération de toutes les tâches du projet comme contexte
    const allTasks = await getTasksFromProject(projectId)
    const contextFormatted =
      allTasks?.map((task) => ({
        title: task.title,
        description: task.description,
        status: task.status,
        points: task.points,
        type: task.type,
        assignee: task.assignee,
        priority: task.priority,
      })) ?? []

    const data: Record<string, unknown> = {
      description,
      context: contextFormatted,
      assignees: assignees.map((user) => user.username),
    }

    const result = await fetchFromColab(data)

    if (!result?.tasks || result.tasks.length === 0) {
      throw new Error("Aucune tâche retournée par le modèle Colab")
    }

    return {
      success: true,
      tasks: result.tasks,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    logger.error(errorMessage, "[AI] Génération de tâches")

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Génère des sous-tâches avec contexte simplifié
 * Reçoit: contexte (toutes les tâches principales), maxSubTasks, assignees
 */
export async function aiGenerateSubTasks(
  description: string,
  projectId: number,
  assignees: User[],
  maxSubTasks = 5,
): Promise<{ success: boolean; subtasks?: Task[]; error?: string }> {
  try {
    if (description.length === 0) {
      return { success: false, error: "Aucune description fournie" }
    }

    logger.info("[AI] Génération de sous-tâches en cours...")

    if (await isAiLimitReached()) {
      logger.warn("[AI] Limite d'utilisation atteinte")
      return { success: false, error: "Limite d'utilisation AI atteinte" }
    }

    // Récupération de toutes les tâches principales du projet comme contexte
    const allTasks = await getTasksFromProject(projectId)

    // Filtrer seulement les tâches principales (pas les sous-tâches)
    const mainTasks = allTasks?.filter((task) => !task.subTask || task.subTask === "") ?? []

    const contextFormatted = mainTasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      points: task.points,
      type: task.type,
      assignee: task.assignee,
      priority: task.priority,
    }))

    // Données envoyées à l'API Colab pour la génération de sous-tâches
    const data: Record<string, unknown> = {
      description,
      context: contextFormatted, // Toutes les tâches principales
      maxSubTasks: maxSubTasks,
      assignees: assignees.map((user) => user.username),
      mode: "subtasks_generation",
    }

    const result = await fetchSubTasksFromColab(data)

    if (!result?.subtasks || result.subtasks.length === 0) {
      throw new Error("Aucune sous-tâche retournée par le modèle Colab")
    }

    return {
      success: true,
      subtasks: result.subtasks,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    logger.error(errorMessage, "[AI] Génération de sous-tâches")

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Attribue des propriétés intelligentes à une tâche
 */
export async function smartPropertiesAction(
  title: string,
  description: string,
  assignees: User[],
): Promise<{
  assignee?: any
  success: boolean
  properties?: Task
  error?: string
}> {
  try {
    if (!title || !description) {
      return { success: false, error: "Titre et description requis" }
    }

    logger.info("[AI] Attribution des propriétés intelligentes...")

    const data = {
      title,
      description,
      assignees: assignees.map((user) => user.username),
    }

    const result = await fetchFromColab(data)

    if (!result?.tasks || result.tasks.length === 0) {
      throw new Error("Aucune propriété retournée par Colab")
    }

    return {
      success: true,
      properties: result.tasks[0],
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    logger.error(errorMessage, "[AI] Attribution des propriétés")

    return {
      success: false,
      error: errorMessage,
    }
  }
}
