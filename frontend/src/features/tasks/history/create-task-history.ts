/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import { authenticate } from "~/actions/security/authenticate";
import { type UpdateTaskData } from "~/actions/task-actions";
import { logger } from "~/lib/logger";
import { type Task } from "~/schema";

// task object keys that will non be included in task history
const excludedKeys = [
	"lastEditedAt",
	"insertedDate",
	"backlogOrder",
	"id",
	"title",
	"description",
];

export async function createTaskHistory(
	taskId: number,
	incomingTaskData: UpdateTaskData,
	existingTask: Task,
) {
	const userId = await authenticate();
	

	// normalize the incoming data
	const existingTaskTransformed = {
		...existingTask,
		assignee  : existingTask.assignee,
		sprintId: String(existingTask.sprintId),
	};
	console.log("one",existingTask)
	console.log("two",existingTaskTransformed)

	if (existingTaskTransformed.assignee === null) {
		existingTaskTransformed.assignee = "unassigned";
	}

	const newActivity = [];
	console.log("see",incomingTaskData)
	// loop through the keys to identify changes
	for (const key in incomingTaskData) {
		const value = incomingTaskData[key as keyof typeof incomingTaskData];
		if (value === undefined || excludedKeys.includes(key)) continue;
		if (value === existingTaskTransformed[key as keyof Task]) continue;
		logger.info(
			{ value, existingTask: existingTaskTransformed[key as keyof Task] },
			"Creating history item",
		);

		const newHistoryItem = {
			task: taskId,
			property_key: key,
			property_value: String(value),
			old_property_value: String(
				existingTaskTransformed[key as keyof Task],
			),
			user: userId,
			inserted_date: new Date(),
		};

		//const validatedItem = insertTaskHistorySchema.parse(newHistoryItem);
		newActivity.push(newHistoryItem);

	}

	await fetch(`${process.env.DJANGO_API_URL}/taches/${taskId}/history/`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json", // or use cookies/session
		},
		body: JSON.stringify(newActivity), 
	});
	
}
