/* eslint-disable import/order */
"use client";

import React, { useEffect, useMemo } from "react";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { find } from "lodash";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import {
	deleteTask,
	getTasksFromProject,
	updateTask,
} from "~/actions/task-actions";
import Message from "~/components/Message";
import SimpleTooltip from "~/components/SimpleTooltip";
import { Button } from "~/components/ui/button";
import CreateTask from "~/features/tasks/components/CreateTask";
import { type TaskFormType as CreateTaskData } from "~/features/tasks/components/CreateTask";
import {
	type StatefulTask,
	getPropertyConfig,
	taskVariants,
} from "~/features/tasks/config/taskConfigType";
import { updateOrder } from "~/features/tasks/utils/order";
import { getRefetchIntervals } from "~/lib/refetchIntervals";
import { cn } from "~/lib/utils";
import type { Task as TaskType } from "~/schema";
import { useAppStore } from "~/store/app";
import { useRealtimeStore } from "~/store/realtime";
import TaskList from "./TaskList";
import LoadingTaskList from "../LoadingTaskList";
import TotalTaskListPoints from "../TotalTaskListPoints";

export type UpdateTask = {
	id: number;
	newTask: Partial<CreateTaskData>;
};

type Props = {
	projectId: string;
};

type TaskTypeOverride = Omit<TaskType, "sprintId"> & {
	spintId: string;
};

async function updateTaskWrapper({ id, newTask }: UpdateTask) {
	await updateTask(id, newTask);
}

export default function TasksContainer({ projectId }: Props) {
	/**
	 * Get the assignees and sprints
	 */
	const [filters, groupByBacklog] = useAppStore(
		useShallow((state) => [state.filters, state.groupByBacklog]),
	);

	const [assignees, sprints] = useRealtimeStore(
		useShallow((state) => [state.assignees, state.sprints]),
	);

	const groupBy = useMemo(() => {
		return groupByBacklog;
	}, [groupByBacklog]);

	/**
	 * Fetch the tasks from the server and handle optimistic updates
	 */
	const queryClient = useQueryClient();

	async function refetch() {
		const data = await getTasksFromProject(parseInt(projectId));

		let newTasks = data;
		if (newTasks) {
			const previousTasks = queryClient.getQueryData<TaskType[]>([
				"tasks",
				projectId,
			]);

			newTasks = newTasks.map((task) => {
				const isExistingTask = find(previousTasks, { id: task.id });
				return isExistingTask
					? task
					: { ...task, options: { ...task.options, isNew: true } };
			});
		}

		return newTasks;
	}

	const result = useQuery({
		queryKey: ["tasks", projectId],
		queryFn: () => refetch(),
		staleTime: 6 * 1000,
		refetchInterval: getRefetchIntervals().tasks,
	});

	const editTaskMutation = useMutation({
		mutationFn: ({ id, newTask }: UpdateTask) =>
			updateTaskWrapper({ id, newTask }),
		onMutate: async ({ id, newTask }) => {
			await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
			const previousTasks = queryClient.getQueryData<TaskType[]>([
				"tasks",
			]);
			queryClient.setQueryData<TaskTypeOverride[]>(
				["tasks", projectId],
				(old) =>
					old?.map((task) =>
						task.id === id
							? {
									...task,
									...newTask,
								}
							: task,
					) ?? [],
			);
			return { previousTasks };
		},
		onError: (err, _, context) => {
			toast.error(err.message);
			queryClient.setQueryData(
				["tasks", projectId],
				context?.previousTasks,
			);
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
	});

	const deleteTaskMutation = useMutation({
		mutationFn: (id: number) => deleteTask(id),
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
			const previousTasks = queryClient.getQueryData<TaskType[]>([
				"tasks",
			]);
			queryClient.setQueryData<TaskType[]>(
				["tasks", projectId],
				(old) => old?.filter((task) => task.id !== id) ?? [],
			);
			return { previousTasks };
		},
		onError: (err, variables, context) => {
			toast.error(err.message);
			queryClient.setQueryData(
				["tasks", projectId],
				context?.previousTasks,
			);
		},
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: ["tasks", projectId] }),
	});

	const orderTasksMutation = useMutation({
		mutationFn: (taskOrder: Map<number, number>) => updateOrder(taskOrder),
		onMutate: async (taskOrder: Map<number, number>) => {
			await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });

			const previousTasks = queryClient.getQueryData<TaskType[]>([
				"tasks",
				projectId,
			]);

			queryClient.setQueryData<TaskType[]>(
				["tasks", projectId],
				(oldTasks) => {
					const updatedTasks =
						oldTasks?.map((task) => {
							const newOrder = taskOrder.get(task.id);
							return newOrder !== undefined
								? { ...task, backlogOrder: newOrder }
								: task;
						}) ?? [];

					return updatedTasks;
				},
			);

			return { previousTasks };
		},
		onError: (err, variables, context) => {
			toast.error(err.message);
			queryClient.setQueryData(
				["tasks", projectId],
				context?.previousTasks,
			);
		},
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: ["tasks", projectId] }),
	});

	/**
	 * Handle Task Ordering and drag and drop
	 */
	const [taskOrder, setTaskOrder] = React.useState<number[]>([]);
	useEffect(() => {
		if (result.data) {
			const orderedIds = result.data
				.sort((a, b) => a.backlogOrder - b.backlogOrder)
				.map((task) => task.id);
			setTaskOrder(orderedIds);
		}
	}, [result.data, assignees, sprints]);

	function onDragEnd(dragResult: DropResult) {
		const { source, destination } = dragResult;
		if (
			!destination ||
			(source.index === destination.index &&
				source.droppableId === destination.droppableId)
		) {
			return;
		}

		const newTaskOrder = Array.from(taskOrder);
		const [reorderedId] = newTaskOrder.splice(source.index, 1);
		if (!reorderedId) return;

		if (source.droppableId !== destination.droppableId) {
			const task = result.data?.find((task) => task.id === reorderedId);
			if (!task || !groupBy) return;
			// to avoid popping we need to set the task to the new group here
			queryClient.setQueryData<StatefulTask[]>(
				["tasks", projectId],
				(old) =>
					old?.map((currentTask) =>
						currentTask.id === reorderedId
							? {
									...task,
									[groupBy]: destination.droppableId,
									backlogOrder: destination.index,
								}
							: currentTask,
					) ?? [],
			);
			let transformedValue: string = destination.droppableId;
			if (groupBy === "assignee" && destination.droppableId === null) {
				transformedValue = "unassigned";
			}

			editTaskMutation.mutate({
				id: task.id,
				newTask: {
					[groupBy]: transformedValue,
					backlogOrder: destination.index,
				},
			});
		}

		newTaskOrder.splice(destination.index, 0, reorderedId);
		setTaskOrder(newTaskOrder);
		const taskOrderMap = new Map(
			newTaskOrder.map((id, index) => [id, index]),
		);
		orderTasksMutation.mutate(taskOrderMap);
	}

	/**
	 * Grouping tasks
	 */
	const options = React.useMemo(() => {
		if (!groupBy) return null;
		const config = getPropertyConfig(groupBy, assignees, sprints);
		if (!config) return null;
		if (config.type !== "enum" && config.type !== "dynamic") return null;
		return config.options;
	}, [groupBy, assignees, sprints]);

	if (!result.data || (taskOrder.length === 0 && result.data.length !== 0))
		return <LoadingTaskList />;

	if (result.data.length === 0) {
		return (
			<Message
				type="faint"
				description={
					<p className="py-2">Please create a task to get started.</p>
				}
				className="min-w-[600px]"
			>
				This project doesn&apos;t have any tasks yet.
			</Message>
		);
	}

	return (
		<DragDropContext onDragEnd={onDragEnd}>
			<div>
				{groupBy && options ? (
					options.map((option) => (
						<div
							key={option.key}
							className={cn(
								taskVariants({
									color: option.color,
									context: "menu",
								}),
							)}
						>
							<div className="flex w-full items-center gap-2 pl-4 pr-2 pt-2">
								{option.icon}
								<p>
									{option.displayName
										.replace(/\[.*?\]/g, "")
										.trim()}{" "}
									-{" "}
								</p>
								<TotalTaskListPoints listId={option.key} />
								<div className="flex-grow" />
								<CreateTask
									projectId={projectId}
									overrideDefaultValues={{
										[groupBy]: option.key,
									}}
								>
									<div>
										<SimpleTooltip
											label={
												<span className="flex items-center gap-1">
													Add{" "}
													<span
														className={cn(
															"test-xs flex items-center gap-1 rounded-xl px-1",
															taskVariants({
																color: option.color,
															}),
														)}
													>
														{option.icon}
														{option.displayName}
													</span>
													Task
												</span>
											}
											side="left"
										>
											<Button
												size="icon"
												variant="ghost"
												className="text-muted-foreground"
											>
												<PlusCircledIcon />
											</Button>
										</SimpleTooltip>
									</div>
								</CreateTask>
							</div>
							<div className="pb-2">
								<TaskList
									listId={option.key}
									taskOrder={taskOrder}
									tasks={result.data}
									filters={filters}
									addTaskMutation={editTaskMutation}
									deleteTaskMutation={deleteTaskMutation}
									projectId={projectId}
								/>
							</div>
						</div>
					))
				) : (
					<TaskList
						listId="tasks"
						taskOrder={taskOrder}
						tasks={result.data}
						filters={filters}
						addTaskMutation={editTaskMutation}
						deleteTaskMutation={deleteTaskMutation}
						projectId={projectId}
					/>
				)}
			</div>
		</DragDropContext>
	);
}
