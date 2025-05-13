/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// permission.ts
"use server";

export async function checkPermissions(
	userId: string,
	projectId: number,
	roles?: string[], // Utilise le même type que celui que Django attend
) {
	const res = await fetch(`${process.env.DJANGO_API_URL}/api/permissions/check/`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			userId,
			projectId,
			roles,
		}),
	});

	if (!res.ok) {
		const data = await res.json();
		throw new Error(data.error || "Permission check failed");
	}
}
