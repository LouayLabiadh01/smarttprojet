/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// user-actions.tsx

"use server";

export async function addUserToProject(
	userId: string,
	projectId: number,
	role: "owner" | "member" = "member",
) {
	const response = await fetch(`${process.env.DJANGO_API_URL}/api/projects/add_user/`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			user_id: userId,
			project_id: projectId,
			role,
		}),
	});

	if (!response.ok) {
		const data = await response.json();
		throw new Error(data.message || "Failed to add user to project");
	}
}


export async function getUser(userId: string) {
	const response = await fetch(`${process.env.DJANGO_API_URL}/users/api/${userId}/`);

	if (!response.ok) {
		throw new Error("Failed to fetch user");
	}

	const data = await response.json();
	return data;
}
