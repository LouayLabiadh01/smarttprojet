/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import { addMinutes, startOfDay } from "date-fns";

import { authenticate } from "~/actions/security/authenticate";
import { createSprintForProject } from "~/actions/sprint-actions";
import { logger } from "~/lib/logger";
import { type NewProject, insertProjectSchema } from "~/schema";

type ProjectResponse = {
	newProjectId: number;
	inviteToken: string | null;
	status: boolean;
	message: string;
};

export type CreateForm = {
	name: NewProject["name"];
	is_ai_enabled: boolean;
	description?: string;
	sprint_duration: number;
	sprint_start: Date;
	invitees: string[];
	timezoneOffset: number;
};

export async function createProject(data: CreateForm): Promise<ProjectResponse> {
	try {
		const userId = await authenticate();
		const childLogger = logger.child({ userId, data });
		childLogger.info("[CREATE PROJECT]");
		console.log(data)
		data.sprint_start = new Date(data.sprint_start)
		// Adapter les données au fuseau horaire
		data.sprint_start = addMinutes(
			startOfDay(new Date(data.sprint_start)),
			data.timezoneOffset,
		);

		// Validation du schéma côté frontend
		const validData = insertProjectSchema.parse(data);

		const response = await fetch(`${process.env.DJANGO_API_URL}/api/projects/create/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-User-Id": userId, // Simule l’authentification côté Django
			},
			body: JSON.stringify(validData),
		});

		const json = await response.json();

		if (!response.ok || !json.status) {
			throw new Error(json.message || "Failed to create project");
		}

		const insertId = json.newProjectId;

		// Appel local pour créer le sprint
		await createSprintForProject(insertId);

		return {
			newProjectId: insertId,
			inviteToken: json.inviteToken,
			status: true,
			message: json.message,
		};

	} catch (error) {
		logger.error(error);
		return handleCreateProjectError(error);
	}
}

function handleCreateProjectError(error: unknown): ProjectResponse {
	if (error instanceof Error) {
		if (error.message.includes("Project name already exists")) {
			return {
				newProjectId: -1,
				inviteToken: null,
				status: false,
				message: "Project name already exists",
			};
		}
		return {
			newProjectId: -1,
			inviteToken: null,
			status: false,
			message: error.message,
		};
	} else {
		return {
			newProjectId: -1,
			inviteToken: null,
			status: false,
			message: "Unknown error",
		};
	}
}
