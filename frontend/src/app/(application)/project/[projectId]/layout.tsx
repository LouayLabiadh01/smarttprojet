/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from "react";

import { currentUser } from "@clerk/nextjs/server";
import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";
import { type Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAssigneesForProject, getProject } from "~/actions/project-actions";
import { getSprintsForProject } from "~/actions/sprint-actions";
import AppSidebar from "~/components/layout/sidebar/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
//import { getAiLimitCount } from "~/features/ai/actions/ai-limit-actions";
import { getAllNotifications } from "~/features/notifications/actions/notification-actions";
import { logger } from "~/lib/logger";
import constructToastURL from "~/lib/toast/global-toast-url-constructor";

import ProjectState from "./project-state";
import { getUser } from "~/actions/user-actions";
import { ThemeProvider } from "~/components/theme-provider";
import { ModeToggle } from "~/components/ui/mode-toggle";

type Params = {
	children: React.ReactNode;
	params: {
		projectId: string;
	};
};

export function generateMetadata(): Metadata {
	return {
		title: {
			default: "SmartProjet",
			template: "SmartProjet > %s",
		},
	};
}

export default async function ApplicationLayout({
	children,
	params: { projectId },
}: Params) {
	const user = await currentUser();
	if (!user) {
		redirect(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			constructToastURL(
				"Vous devez être connecté pour voir l'application",
				"error",
			),
		);
	}
	const userr = await getUser(user.id);
	const isAdmin = userr.role === "Admin";
	const isChef = userr.role ==="Chef";

	const projectIdInt = parseInt(projectId, 10);

	// prefetch the project, assignees, sprints, and notifications
	const queryClient = new QueryClient();
	await queryClient.prefetchQuery({
		queryKey: ["project", projectIdInt],
		queryFn: () => getProject(projectIdInt, user.id),
	});
	await queryClient.prefetchQuery({
		queryKey: ["assignees/sprints", projectIdInt],
		queryFn: async () => {
			const assignees = await getAssigneesForProject(projectIdInt);
			const sprints = await getSprintsForProject(projectIdInt); // assuming this returns array directly
	
			return {
				assignees,
				sprints,
			};
		},
	});
	
	
	await queryClient.prefetchQuery({
		queryKey: ["notifications", projectIdInt],
		queryFn: async () => {
			const result = await getAllNotifications(user.id);
			if (result.error !== null) {
				logger.error(result.error);
				return [];
			}
			return result.data;
		},
	});

	//const aiUsageCount = await getAiLimitCount();

	const sidebarState = cookies().get("sidebar:state")?.value;
	const defaultOpen = sidebarState === undefined || sidebarState === "true";

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<ProjectState
				projectId={projectIdInt}
				userId={user.id}
				aiUsageCount={5}
			/>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				<SidebarProvider defaultOpen={defaultOpen}>
					
					<AppSidebar projectId={projectId} isAdmin={isAdmin} isChef={isChef} />
					<main className="flex h-[calc(100svh-1rem)] w-full flex-1 flex-col border-l border-t">
						{children}
					</main>
				</SidebarProvider>
			</ThemeProvider>
		</HydrationBoundary>
	);
}
