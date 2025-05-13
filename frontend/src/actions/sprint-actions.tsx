/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import { revalidatePath } from "next/cache";

import { env } from "~/env.mjs";

export async function createSprintForProject(projectId: number) {
	await fetch(`http://localhost:3000/api/cron/sprint?projectId=${projectId}`, {
		method: "GET",
		headers: {
			authorization: "Bearer " + env.CRON_SECRET,
		},
	});
	revalidatePath(`/`);
	return;
}

export async function getSprintsForProject(projectId: number) {
	const res = await fetch(`${process.env.DJANGO_API_URL}/api/sprints/${projectId}/`, {
		headers: { "Content-Type": "application/json" },
		cache: "no-store",
	});
	if (!res.ok) return [];
	const data = await res.json();
	return data;
}

export async function getCurrentSprintForProject(projectId: number) {
	const res = await fetch(`${process.env.DJANGO_API_URL}/api/sprints/${projectId}/current/`, {
		headers: { "Content-Type": "application/json" },
		cache: "no-store",
	});
	if (!res.ok) return null;
	const data = await res.json();
	console.log(data)
	return data;
}

export async function updateSprintsForProject(
	projectId: number,
	sprintDuration: number,
	sprintStart: Date,
) {
	const res = await fetch(`${process.env.DJANGO_API_URL}/api/sprints/${projectId}/update/`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			sprintDuration,
			sprintStart: sprintStart.toISOString(),
		}),
		cache: "no-store",
	});
	const data = await res.json();
	if (data.success) {
		await createSprintForProject(projectId);
		revalidatePath(`/`);
	}
	return data.success;
}
