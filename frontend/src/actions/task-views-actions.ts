/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
"use server";

import { authenticate } from "~/actions/security/authenticate";

const BASE_URL = `${process.env.DJANGO_API_URL}/taches`;

export async function updateOrInsertTaskView(taskId: number) {
	const userId = await authenticate();
	if (!userId) return;

	await fetch(`${BASE_URL}/${taskId}/view/`, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			Authorization: `${userId}`,
		},
	});
}

export async function getMostRecentTasks(projectId: number, number = 5) {
	const userId = await authenticate();
	if (!userId) return [];

	const res = await fetch(`${BASE_URL}/project/${projectId}/recent/?number=${number}`, {
		method: "GET",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!res.ok) {
		console.error("Failed to fetch recent tasks");
		return [];
	}

	const data = await res.json();
	return data;
}
