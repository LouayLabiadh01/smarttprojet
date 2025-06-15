/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

import { createNotification } from "~/features/notifications/actions/notification-actions";
import { type TaskFormType as CreateTaskData } from "~/features/tasks/components/CreateTask";
import {
	type StatefulTask,
	CreateTaskSchema,
} from "~/features/tasks/config/taskConfigType";
import { createTaskHistory } from "~/features/tasks/history/create-task-history";
import { normalizeTaskSprintStatus } from "~/features/tasks/utils/normalizeTaskSprintStatus";
import { taskNameToBranchName } from "~/features/tasks/utils/task-name-branch-converters";
import { logger } from "~/lib/logger";
import { throwServerError } from "~/utils/errors";

import { authenticate } from "./security/authenticate";
import { checkPermissions } from "./security/permissions";
import { updateOrInsertTaskView } from "./task-views-actions";



const API_URL = process.env.DJANGO_API_URL;


 // adjust path as needed

export async function createTask(data: CreateTaskData) {
	try {
		const userId = await authenticate();
		await checkPermissions(userId, data.projectId);

		const Task = CreateTaskSchema.parse(data);
		const newTask = { ...Task, subTask: data.subTask };
		newTask.branchName = taskNameToBranchName(newTask.title);

		const sprintId = Number(data.sprintId);
		const normalizedNewTask = normalizeTaskSprintStatus(newTask, sprintId);

		// 1. Create Task
		const taskResponse = await fetch(`${API_URL}/taches/create/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `${userId}`,
			},
			body: JSON.stringify(normalizedNewTask),
		});

		if (!taskResponse.ok) {
			throw new Error(`Failed to create task: ${taskResponse.statusText}`);
		}

		const task = await taskResponse.json();

		// 2. Create History
		await fetch(`${API_URL}/taches/${task.id}/history/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `${userId}`,
			},
			body: JSON.stringify([
				{
					user: userId,
					property_key: "assignee",
					property_value: newTask.assignee ?? "",
					comment: "Created the task",
				},
			]),
		});
		await createNotification({
			date: new Date(),
			message: "was created and assigned to you.",
			user_id: newTask.assignee ?? "unassigned",
			taskId: task.id,
			projectId: newTask.projectId,
		});
		

		revalidatePath("/");
		return task;
	} catch (error) {
		logger.error(error);
		if (error instanceof z.ZodError) {
			const validationError = fromZodError(error);
			if (validationError) throw Error(validationError.message);
		}
		if (error instanceof Error) throwServerError(error.message);
	}
}


export async function getTasksFromProject(projectId: number) {
	try {
		const userId = await authenticate();
		await checkPermissions(userId, projectId);

		const response = await fetch(`${API_URL}/taches/project/${projectId}/`, {
			headers: { Authorization: `Bearer ${userId}` },
		});

		if (!response.ok) {
			throw new Error("Failed to fetch tasks");
		}

		const tasks = await response.json();
		return tasks as StatefulTask[];
	} catch (error) {
		if (error instanceof Error) throwServerError(error.message);
	}
}

export async function getAllActiveTasksForProject(projectId: number) {
	try {
		const response = await fetch(`${API_URL}/taches/project/${projectId}/active/`);
		if (!response.ok) {
			throw new Error("Failed to fetch active tasks");
		}
		return await response.json();
	} catch (error) {
		if (error instanceof Error) throwServerError(error.message);
	}
}

export async function deleteTask(id: number) {
	try {
		const userId = await authenticate();

		const response = await fetch(`${API_URL}/taches/${id}/delete/`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${userId}` },
		});

		if (!response.ok) {
			throw new Error("Failed to delete task");
		}

		revalidatePath("/");
	} catch (error) {
		logger.error(error);
	}
}
export type UpdateTaskData = Partial<CreateTaskData>;
export async function updateTask(id: number, data: Partial<CreateTaskData>) {
	try {
		const userId = await authenticate();

		console.log('woywoy',data)


		const existingtask = await fetch(`${API_URL}/taches/${id}/`, {
			headers: { Authorization: `Bearer ${userId}` },
			cache: "no-store",
		});

		if (!existingtask.ok) {
			throw new Error(`Task ${id} not found or unauthorized`);
		}

		const existingTask = await existingtask.json();

		const response = await fetch(`${API_URL}/taches/${id}/update/`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `${userId}`,
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error("Failed to update task");
		}

		await createTaskHistory(id, data, existingTask);

		
		revalidatePath("/");
	} catch (error) {
		if (error instanceof z.ZodError) {
			const validationError = fromZodError(error);
			if (validationError) throw Error(validationError.message);
		}
		if (error instanceof Error) throwServerError(error.message);
	}
}

export async function getTask(id: number) {
	try {
		const { userId } = await auth();
		if (!userId) return { data: null, error: "UserId not found" };

		// Fetch main task
		const response = await fetch(`${API_URL}/taches/${id}/`, {
			headers: { Authorization: `Bearer ${userId}` },
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(`Task ${id} not found or unauthorized`);
		}

		const task = await response.json();

		// Fetch task activity (history + last views)
		const activityRes = await fetch(`${API_URL}/taches/${id}/activity/`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			cache: "no-store",
		});

		if (!activityRes.ok) {
			throw new Error("Failed to fetch task activity");
		}

		const activityData = await activityRes.json();

		await updateOrInsertTaskView(id);

		return {
			data: {
				...task,
				taskHistory: activityData.taskHistory,
				lastViews: activityData.lastViews,
				comments : activityData.comments
			},
			error: null,
		};
	} catch (error) {
		logger.error(error);
		if (error instanceof Error) return { data: null, error: error.message };
		return { data: null, error: "An unknown error occurred" };
	}
}

