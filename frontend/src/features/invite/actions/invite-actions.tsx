/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { z } from "zod";

import { authenticate } from "~/actions/security/authenticate";
import { checkPermissions } from "~/actions/security/permissions";
import ProjectInviteEmail from "~/features/invite/project-invite-email-template";
import { createNotification } from "~/features/notifications/actions/notification-actions";

const getInviteSchema = z.object({
	userId: z.string(),
	projectId: z.number(),
});

async function callDjangoAPI(endpoint: string, data: any) {
	const response = await fetch(`${process.env.DJANGO_API_URL}${endpoint}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	return await response.json();
}

export async function createInvite(projectId: number) {
	const userId = await authenticate();
	await checkPermissions(userId, projectId);

	const dataObject = { userId, projectId };
	const inviteValidation = getInviteSchema.safeParse(dataObject);
	if (!inviteValidation.success) return false;

	const result = await callDjangoAPI("/api/invite/create", dataObject);
	if (!result.success) return false;

	return result.token;
}

export async function joinProject(token: string) {
	const userId = await authenticate();

	const result = await callDjangoAPI("/api/invite/join", { userId, token });
	console.log(result)

	if (result.success && result.message.includes("joined")) {
		const client = await clerkClient();
		const user = await client.users.getUser(userId);

		if (user) {
			await createNotification({
				user_id: result.userId,
				message: `${user.username} has joined your project`,
				date: new Date(),
				projectId: result.projectId,
				taskId : null,
			});
		}
	}

	return result;
}

export async function sendEmailInvites(projectId: number, emails: string[]) {
	const { userId } = await auth();
	if (!userId) return { newProjectId: -1, status: false, message: "UserId not found" };

	if (!emails || emails.length === 0) {
		return { status: false, message: "Skipping Invites" };
	}

	const inviteToken = await createInvite(projectId);
	const client = await clerkClient();
	const user = await client.users.getUser(userId);

	if (!inviteToken || !user?.username) {
		return { status: false, message: "Invites failed to send" };
	}

	const projectName = "Your Project"; // Tu peux récupérer dynamiquement si nécessaire

	const email = {
		from: "Taskly@tasklypm.com",
		subject: `You are Invited! Join ${projectName} on Taskly`,
		html: render(
			<ProjectInviteEmail
				projectName={projectName}
				token={inviteToken}
				inviteUserName={user.username}
			/>
		),
	};

	const resend = new Resend(process.env.RESEND_API_KEY);
	await Promise.all(emails.map((emailTo) => resend.emails.send({ ...email, to: emailTo })));

	return {
		status: true,
		message: "Invites sent",
	};
}
