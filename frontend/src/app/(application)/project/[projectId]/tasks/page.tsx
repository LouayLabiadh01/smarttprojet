import { currentUser } from "@clerk/nextjs/server";
import {
	dehydrate,
	HydrationBoundary,
	QueryClient,
} from "@tanstack/react-query";
import { type Metadata } from "next";
import dynamic from "next/dynamic";

import { getTasksFromProject } from "~/actions/task-actions";
import CreateGithubTicket from "~/components/CreateGithubTicket";
import PageHeader from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/button";
import AiDialog from "~/features/ai/components/AiDialog";
import FilterAndGroupToggles from "~/features/tasks/components/backlog/filters/FilterAndGroupToggles";
import LoadingFilters from "~/features/tasks/components/backlog/filters/LoadingFilters";
import TasksContainer from "~/features/tasks/components/backlog/TasksContainer";
import CreateTask from "~/features/tasks/components/CreateTask";

export const metadata: Metadata = {
	title: "Tâches",
};

const Filters = dynamic(
	() => import("~/features/tasks/components/backlog/filters/Filters"),
	{
		ssr: false,
		loading: () => <LoadingFilters />,
	},
);

type Params = {
	params: {
		projectId: string;
	};
};

export default async function BacklogPage({ params: { projectId } }: Params) {
	// Prefetch tasks using react-query
	const queryClient = new QueryClient();
	await queryClient.prefetchQuery({
		queryKey: ["tâches", projectId],
		queryFn: () => getTasksFromProject(parseInt(projectId)),
	});
	const user = await currentUser();

	return (
		<div className="relative flex flex-1 flex-col overflow-y-hidden">
			<PageHeader breadCrumbs>
				<FilterAndGroupToggles />
				<AiDialog projectId={projectId} />
				<CreateTask projectId={projectId}>
					<Button
						className="gap-1 rounded-xl font-bold"
						size="sm"
						variant="secondary"
					>
						Ajouter une tâche
					</Button>
				</CreateTask>
			</PageHeader>
			<Filters username={user?.username} />
			<section className="flex flex-1 flex-col overflow-scroll">
				<HydrationBoundary state={dehydrate(queryClient)}>
					<TasksContainer projectId={projectId} />
				</HydrationBoundary>
			</section>
			<CreateGithubTicket />
		</div>
	);
}
