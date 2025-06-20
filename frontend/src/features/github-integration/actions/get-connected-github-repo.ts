/* eslint-disable import/order */
"use server";



import { logger } from "~/lib/logger";

import { getAccessToken } from "../utils/get-access-token";
import { getRepos } from "../utils/get-repos";

export async function getConnectedGithubRepo(installationId: number | null) {
	if (!installationId) return null;
	try {
		const accessToken = await getAccessToken(installationId);
		return await getRepos(accessToken);
	} catch (error) {
		logger.error("Failed to get GitHub installation access token:", error);
		return null;
	}
}
