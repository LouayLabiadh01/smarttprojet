/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { and,  eq, ne } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "~/db";
import { env } from "~/env.mjs";
import { tasks } from "~/schema";

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");

	if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
		return new Response("Unauthorized", {
			status: 401,
		});
	}

	const searchParams = request.nextUrl.searchParams;
	const projectId = searchParams.get("projectId");
	const baseUrl = process.env.DJANGO_API_URL; // ex: "http://localhost:8000"

	const djangoApiUrl = `${baseUrl}/api/sprint/auto/${
		projectId ? `?projectId=${projectId}` : ""
	}`;

	const djangoResponse = await fetch(djangoApiUrl, {
		headers: {
			Authorization: `Bearer ${env.CRON_SECRET}`,
		},
	});

	if (!djangoResponse.ok) {
		return new Response("Failed to sync with backend", {
			status: 500,
		});
	}

	const results: Record<
		number,
		{
			startDate: string;
			endDate: string;
		}[]
	> = await djangoResponse.json();

	// update non-finished tasks of current sprint to backlog
	for (const projectIdStr in results) {
		const projectId = parseInt(projectIdStr);
		console.log("------------------\n\n");
		console.log(projectId);

		// récupérer tous les sprints pour le projet
		const now = new Date();
		const sprintsForProject = results[projectId];

		const currentSprint = sprintsForProject?.find(
			(sprint) =>
				new Date(sprint.startDate) <= now &&
				new Date(sprint.endDate) >= now
		);

		if (!currentSprint) {
			continue;
		}

		await db
			.update(tasks)
			.set({ status: "backlog", sprintId: -1 })
			.where(
				and(
					eq(tasks.projectId, projectId),
					ne(tasks.status, "done"),
					ne(tasks.status, "backlog"),
					ne(tasks.sprintId, -1),
				),
			);

	}

	return new Response(JSON.stringify(results), { status: 200 });
}
