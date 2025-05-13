"use server";

import { revalidatePath } from "next/cache";

import { authenticate } from "~/actions/security/authenticate";
//import { createNotification } from "~/features/notifications/actions/notification-actions";

// Adjust if your Django server is running elsewhere
const BASE_URL = process.env.DJANGO_API_URL;

export async function createComment(comment: string, taskId: number) {
	const userId = await authenticate();
	const insertedDate1 = new Date();
	console.log("Inserteddate : ",insertedDate1)

	const insertedDate = insertedDate1.toISOString();
	console.log("newinserted",insertedDate)
	// Replace (user_xxx) mentions with usernames or track mentions if needed
	// You could also send the raw comment and handle mention parsing in Django
	const commentWithUsers = comment;

	// Call your Django backend to create the comment
	const response = await fetch(`${BASE_URL}/taches/${taskId}/comments/`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			comment: commentWithUsers,
			user_id: userId,
			inserted_date: insertedDate,
		}),
	});


	if (!response.ok) {
		console.error(await response.text());
		throw new Error("Failed to post comment");
	}

	revalidatePath("/");
}
