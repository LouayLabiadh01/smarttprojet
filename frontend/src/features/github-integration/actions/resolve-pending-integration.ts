/* eslint-disable import/order */
"use server";

import { eq } from "drizzle-orm";

import { db } from "~/db";
import { logger } from "~/lib/logger";
import { projectToIntegrations, projects } from "~/schema";

import { authenticate } from "../../../actions/security/authenticate";

export async function resolvePendingIntegration(installationId: number) {
	logger.info(
		{ installationId },
		"[GITHUB INTEGRATION] resolvePendingIntegration",
	);
	const user_id = await authenticate();
	const pendingIntegration = await db.query.projectToIntegrations.findFirst({
		where: (projectToIntegrations) =>
			eq(projectToIntegrations.user_id, user_id) &&
			eq(projectToIntegrations.integrationId, "github"),
	});
	logger.info(
		{ pendingIntegration },
		"[GITHUB INTEGRATION] resolvePendingIntegration",
	);

	if (!pendingIntegration) {
		return;
	}

	await db
		.update(projects)
		.set({ githubIntegrationId: installationId })
		.where(eq(projects.id, pendingIntegration.projectId));
	await db
		.delete(projectToIntegrations)
		.where(eq(projectToIntegrations.user_id, user_id));
}
