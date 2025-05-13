/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import chroma from "chroma-js";
import { and, eq } from "drizzle-orm";
import { getAverageColor } from "fast-average-color-node";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { authenticate } from "~/actions/security/authenticate";
import { checkPermissions } from "~/actions/security/permissions";
import { db } from "~/db";
import { type Project, projects, tasks, usersToProjects } from "~/schema";

const API_URL = process.env.DJANGO_API_URL;

export async function handleProjectInfo(
	projectId: number,
	updatedValues: Partial<Project>,
) {
	/*const userId = await authenticate();*/
	/*await checkPermissions(userId, projectId, ["owner", "admin"]);*/

	const res = await fetch(`${API_URL}/api/projects/${projectId}/update/`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(updatedValues),
	});

	if (!res.ok) {
		const errorResponse = await res.json();
		throw new Error(errorResponse?.error ?? "Failed to update project info");
	}

	revalidatePath("/");
}

export async function handleProjectTheme(
	projectId: number,
	updatedValues: { color: string; image: string },
) {
	const userId = await authenticate();
	await checkPermissions(userId, projectId, ["owner", "admin", "member"]);

	await db
		.update(projects)
		.set({ color: updatedValues.color, image: updatedValues.image })
		.where(eq(projects.id, projectId));

	revalidatePath("/");
}

export async function autoColor(image: string) {
	return await getAverageColor(image).then((color: { hex: string }) => {
		const hex = color.hex;
		const vibrant = chroma(hex).saturate(1).hex();
		return vibrant;
	});
}

export async function handleDeleteProject(projectId: number) {
	const userId = await authenticate();
	await checkPermissions(userId, projectId, ["owner"]);

	if (!projectId) {
		return { success: false, message: "Project ID not found" };
	}

	const res = await fetch(`${API_URL}/api/projects/${projectId}/delete/`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!res.ok) {
		const err = await res.json();
		return { success: false, message: err?.error ?? "Delete failed" };
	}

	redirect("/");
}

export async function leaveProject(projectId: number) {
	const userId = await authenticate();
	await removeUserFromProject(projectId, userId);
}

export async function removeUserFromProject(projectId: number, userId: string) {
	const activeUserId = await authenticate();

	const response = await fetch(`${API_URL}/api/projects/${projectId}/remove-user/`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ user_id: userId }),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error?.error ?? "Failed to remove user from project");
	}

	if (activeUserId !== userId) {
		revalidatePath("/");
	} else {
		redirect("/");
	}
}

export async function editUserRole(
	userToEdit: string,
	projectId: number,
	role: string,
) {
	const userId = await authenticate();
	await checkPermissions(userId, projectId, ["owner", "admin"]);

	if (!["owner", "admin", "member"].includes(role)) {
		return false;
	}

	const res = await fetch(`${API_URL}/api/projects/${projectId}/users/${userToEdit}/role/`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ role }),
	});

	if (!res.ok) {
		return false;
	}

	revalidatePath("/");
	return true;
}