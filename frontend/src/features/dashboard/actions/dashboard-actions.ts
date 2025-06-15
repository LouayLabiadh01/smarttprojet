"use server";
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { authenticate } from "~/actions/security/authenticate";

export type User = {
	user_id: string;
	username: string;
	profilePicture: string;
	role:string;
};

type GetUserSuccess = {
	success: true;
	message: string;
	user: User;
};

type GetUserFailure = {
	success: false;
	message: string;
};

export type GetUserResponse = GetUserSuccess | GetUserFailure;

export async function getUser(): Promise<GetUserResponse> {
	const userId = await authenticate();
	if (!userId) {
		return { success: false, message: "User not authenticated" };
	}

	try {
		const res = await fetch(`${process.env.DJANGO_API_URL}/users/api/${userId}/`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!res.ok) {
			return { success: false, message: "User not found" };
		}

		const user = await res.json();

		return { success: true, message: "User found", user };
	} catch (error) {
		console.error("Failed to fetch user:", error);
		return { success: false, message: "Failed to fetch user" };
	}
}
