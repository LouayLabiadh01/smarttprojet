"use server";

import { revalidatePath } from "next/cache";

import { authenticate } from "~/actions/security/authenticate";

export async function deleteComment(commentId: number) {
	const userId = await authenticate();

	// Call Django backend to delete the comment
	const response = await fetch(`${process.env.DJANGO_API_URL}/taches/comments/delete/${commentId}/`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${userId}`, // if you use JWT or token-based auth
		},
	});

	if (!response.ok) {
		console.error("Failed to delete comment:", await response.text());
		throw new Error("Failed to delete comment");
	}

	revalidatePath("/");
}
