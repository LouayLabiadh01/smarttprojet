/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
"use server";

import {
	type User,
	type UserRole,
} from "~/schema";

export async function getAllProjects(userId: string) {
	try {
		const res = await fetch(`${process.env.DJANGO_API_URL}/api/projects/user/${userId}/`);
		const data = await res.json();
		return data;
	} catch (error) {
		console.error(error);
	}
}

export async function getProject(projectId: number, userId: string) {
	try {
		const res = await fetch(`${process.env.DJANGO_API_URL}/api/projects/${projectId}/user/${userId}/`);
		const result = await res.json();
		return result;
	} catch (error) {
		console.error(error);
		return { data: null, error: "An unknown error occurred" };
	}
}

export async function updateProject(projectId: number, data: any) {
	try {
		const res = await fetch(`${process.env.DJANGO_API_URL}/api/projects/${projectId}/update/`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		const result = await res.json();
		return result;
	} catch (error) {
		console.error(error);
	}
}

export async function getAssigneesForProject(projectId: number) {
	try {
		const res = await fetch(`${process.env.DJANGO_API_URL}/api/projects/${projectId}/assignees/`);
		const result = await res.json();
		console.log(result)
		return result;
	} catch (error) {
		console.error(error);
		return { data: null, error: "An unknown error occurred" };
	}
}

export interface UserWithRole extends User {
	user_role: UserRole;
}

export async function getAllUsersInProject(projectId: number) {
	try {
		const res = await fetch(`${process.env.DJANGO_API_URL}/api/projects/${projectId}/users/`);
		const users = await res.json();
		return users;
	} catch (error) {
		console.error(error);
		return [];
	}
}
