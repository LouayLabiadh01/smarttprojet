/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from "react";

import Link from "next/link";

import { getMostRecentTasks } from "~/actions/task-views-actions";
import PropertyBadge from "~/features/tasks/components/property/PropertyBadge";
import { getEnumOptionByKey } from "~/features/tasks/config/taskConfigType";
import { cn } from "~/lib/utils";
import { type Task as TaskType } from "~/schema";

type RecentTasksProps = {
	projectId: number;
	number?: number;
};

const RecentTasks = async ({ projectId, number }: RecentTasksProps) => {
	let mostRecentTasks: TaskType[] = [];
	try {
		mostRecentTasks = await getMostRecentTasks(projectId, number);
	} catch (error) {
		console.error("Error fetching most recent tasks", error);
		return <p>You have no tasks yet!</p>;
	}

	if (mostRecentTasks.length === 0) return <p>You have no tasks yet!</p>;

	return (
		<ul>
			{mostRecentTasks.map((task) => (
				<Link
					key={task.id}
					href={`/project/${task.projectId}/task/${task.id}`}
				>
					<li className="group relative flex items-center justify-between gap-1 rounded p-1 hover:bg-muted">
						<div className="flex min-w-0 flex-1 items-center gap-1">
							<TaskStatus status={task.status} />
							<p className=" min-w-0 flex-shrink overflow-hidden overflow-ellipsis whitespace-nowrap">
								{task.title}
							</p>
						</div>
					</li>
				</Link>
			))}
		</ul>
	);
};

type Props = {
	status: TaskType["status"];
};

export const TaskStatus = ({ status }: Props) => {
	const option = getEnumOptionByKey(status);
	if (!option) return null;

	return (
		<PropertyBadge
			option={option}
			size="iconXs"
			className={cn("aspect-square group-hover:shadow-lg", {
				"group-hover:border-background": status === "backlog",
			})}
		/>
	);
};

export default RecentTasks;
