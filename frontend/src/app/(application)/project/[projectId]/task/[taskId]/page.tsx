/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type Metadata } from "next";

import { TaskPageWrapper } from "~/features/tasks/components/page/TaskPageWrapper";

type Params = {
	params: {
		taskId: string;
		projectId: string;
	};
};

export async function generateMetadata({
	params: { taskId },
}: Params): Promise<Metadata> {
	const taskIdInteger = parseInt(taskId);
	if (isNaN(taskIdInteger)) {
		return {
			title: "Task",
		};
	}

	const res = await fetch(`${process.env.DJANGO_API_URL}/taches/${taskId}/`, {
		cache: "no-store",
	});
	  
	if (!res.ok) {
	return {
		title: "Task",
	};
	}
	  
	const task = await res.json();
	  
	return {
		title: task.title,
	};
}

export default function TaskPage({ params: { taskId, projectId } }: Params) {
	return <TaskPageWrapper taskId={taskId} projectId={projectId} />;
}
