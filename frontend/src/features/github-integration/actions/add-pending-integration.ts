/* eslint-disable import/order */
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "~/db";
import { logger } from "~/lib/logger";
import { projectToIntegrations, projectToIntegrationsSchema } from "~/schema";

import { authenticate } from "../../../actions/security/authenticate";


export async function addPendingIntegration(
	projectId: number,
	integrationId: string,
) {
	const user_id = await authenticate();
	const data = { projectId, integrationId, user_id };

	logger.info({ data }, "[GITHUB INTEGRATION] addPendingIntegration");
	const validData = projectToIntegrationsSchema
		.pick({ projectId: true, integrationId: true, user_id: true })
		.parse(data);

	const currentPendingIntegration =
		await db.query.projectToIntegrations.findFirst({
			where: (projectToIntegrations) =>
				eq(projectToIntegrations.user_id, user_id) &&
				eq(projectToIntegrations.integrationId, "github"),
		});

	if (currentPendingIntegration) {
		await db
			.update(projectToIntegrations)
			.set(validData)
			.where(eq(projectToIntegrations.user_id, user_id));
		return;
	}

	await db.insert(projectToIntegrations).values(validData);

	revalidatePath("/");
}
