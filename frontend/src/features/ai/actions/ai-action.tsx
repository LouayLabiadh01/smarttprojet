/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";
import { logger } from "~/lib/logger";
import { type User } from "~/schema";

import { isAiLimitReached } from "./ai-limit-actions";
import { getMostRecentTasks } from "../../../actions/task-views-actions";

// Définition de la structure des tâches générées
interface Task {
	title: string;
	description: string;
	status: string;
	points: number;
	priority: string;
	type: string;
	assignee: string;
}

interface ColabResponse {
	tasks: Task[];
}


const COLAB_API_URL = "https://9952-34-125-76-188.ngrok-free.app/generate-tasks"; 

async function fetchFromColab(data: Record<string, unknown>): Promise<ColabResponse | null> {
	try {
		console.log("🔄 Envoi des données à Colab:", data);

		const response = await fetch(COLAB_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		const result: unknown = await response.json();
		console.log("✅ Réponse de Colab API:", result);

		// ✅ Vérification si la réponse est un tableau au lieu d'un objet
		if (Array.isArray(result)) {
			// Transformer la structure pour qu'elle corresponde à ce que ton code attend
			const formattedTasks: Task[] = result.map((task) => ({
				title: task.Title || "",
				description: task.Description || "",
				status: task.Status || "",
				points: task.Points || 0,
				priority: task.Priority || "",
				type: task.Type || "",
				assignee: task.Assignee || "",
			}));

			return { tasks: formattedTasks };
		}

		// Vérification du format de la réponse attendue
		if (
			typeof result === "object" &&
			result !== null &&
			"tasks" in result &&
			Array.isArray(result.tasks)
		) {
			return result as ColabResponse;
		} else {
			throw new Error("Format de réponse invalide depuis Colab API");
		}
	} catch (error) {
		logger.error(error, "[AI] Erreur API Colab");
		return null;
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
			return { success: false, error: "Aucune description fournie" };
		}

		logger.info("[AI] Génération de tâches en cours...");

		if (await isAiLimitReached()) {
			logger.warn("[AI] Limite d'utilisation atteinte");
			return { success: false, error: "Limite d'utilisation AI atteinte" };
		}

		// Récupération du contexte des tâches récentes
		const context = await getMostRecentTasks(projectId, 7);
		const contextFormatted = context.map((task: { title: any; description: any; status: any; points: any; type: any; assignee: any; priority: any; }) => ({
			title: task.title,
			description: task.description,
			status: task.status,
			points: task.points,
			type: task.type,
			assignee: task.assignee,
			priority: task.priority,
		}));

		// Données envoyées à l'API Colab
		const data: Record<string, unknown> = {
			description,
			context: contextFormatted,
			assignees: assignees.map((user) => user.username),
		};

		const result = await fetchFromColab(data);

		// Vérification des tâches générées
		if (!result?.tasks || result.tasks.length === 0) {
			throw new Error("Aucune tâche retournée par le modèle Colab");
		}

		return {
			success: true,
			tasks: result.tasks,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
		logger.error(errorMessage, "[AI] Génération de tâches");

		return {
			success: false,
			error: errorMessage,
		};
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
	assignee?: any; success: boolean; properties?: Task; error?: string 
}> {
	try {
		if (!title || !description) {
			return { success: false, error: "Titre et description requis" };
		}

		logger.info("[AI] Attribution des propriétés intelligentes...");

		const data = {
			title,
			description,
			assignees: assignees.map((user) => user.username),
		};

		const result = await fetchFromColab(data);

		// Vérification des propriétés assignées
		if (!result?.tasks || result.tasks.length === 0) {
			throw new Error("Aucune propriété retournée par Colab");
		}

		return {
			success: true,
			properties: result.tasks[0], // Première tâche générée comme référence
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
		logger.error(errorMessage, "[AI] Attribution des propriétés");

		return {
			success: false,
			error: errorMessage,
		};
	}
}
