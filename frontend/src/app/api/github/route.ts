import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/db";
import { logger } from "~/lib/logger";
//import { taskHistory, tasks } from "~/schema";

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as unknown;

		const schema = z.object({
			action: z.string(),
			installation: z.object({
				id: z.number(),
			}),
			pull_request: z.object({
				state: z.string(),
				title: z.string(),
				merged: z.boolean(),
				head: z.object({
					ref: z.string(),
				}),
			}),
		});
		const result = schema.parse(body);

		logger.info({ result }, "[GITHUB WEBHOOK]");
		const project = await db.query.projects.findFirst({
			where: (project) =>
				eq(project.githubIntegrationId, result.installation.id),
		});
		if (!project) {
			logger.error("[GITHUB WEBHOOK] Project not found");
			return Response.json({ message: "Project not found" });
		}

		const task = await db.query.tasks.findFirst({
			where: (task) => eq(task.branchName, result.pull_request.head.ref),
		});

		if (!task) {
			logger.error("[GITHUB WEBHOOK] Task not found");
			return Response.json({ message: "Task not found" });
		}

		if (result.action === "opened") {
			if (task.status === "todo") {
				/*await db
					.update(tasks)
					.set({ status: "inprogress" })
					.where(eq(tasks.id, task.id));
				await db.insert(taskHistory).values({
					taskId: task.id,
					propertyKey: "status",
					oldPropertyValue: task.status,
					propertyValue: "inprogress",
					userId: "github",
					insertedDate: new Date(),
				});*/
				return Response.json({ message: "Received and updated" });
			}
		}

		if (result.action === "closed" && result.pull_request.merged) {
			if (task.status !== "done") {
				/*await db
					.update(tasks)
					.set({ status: "done" })
					.where(eq(tasks.id, task.id));
				await db.insert(taskHistory).values({
					taskId: task.id,
					propertyKey: "status",
					oldPropertyValue: task.status,
					propertyValue: "done",
					userId: "github",
					insertedDate: new Date(),
				});*/
			}
			return Response.json({ message: "Received and updated" });
		} else if (result.action === "closed") {
			if (task.status !== "todo" && task.status !== "backlog") {
				/*await db
					.update(tasks)
					.set({ status: "todo" })
					.where(eq(tasks.id, task.id));
				await db.insert(taskHistory).values({
					taskId: task.id,
					propertyKey: "status",
					oldPropertyValue: task.status,
					propertyValue: "todo",
					userId: "github",
					insertedDate: new Date(),
				});*/
				return Response.json({ message: "Received and updated" });
			}
		}

		if (
			result.action === "review_requested" ||
			result.action === "ready_for_review"
		) {
			if (
				task.status !== "inreview" &&
				(task.status === "inprogress" || task.status === "todo")
			) {
				/*await db
					.update(tasks)
					.set({ status: "inreview" })
					.where(eq(tasks.id, task.id));
				await db.insert(taskHistory).values({
					taskId: task.id,
					propertyKey: "status",
					oldPropertyValue: task.status,
					propertyValue: "inreview",
					userId: "github",
					insertedDate: new Date(),
				});*/
				return Response.json({ message: "Received and updated" });
			}
		}

		if (result.action === "reopened") {
			if (task.status === "todo") {
				/*await db
					.update(tasks)
					.set({ status: "inprogress" })
					.where(eq(tasks.id, task.id));
				await db.insert(taskHistory).values({
					taskId: task.id,
					propertyKey: "status",
					oldPropertyValue: task.status,
					propertyValue: "inprogress",
					userId: "github",
					insertedDate: new Date(),
				});*/
				return Response.json({ message: "Received and updated" });
			}
		}

		return Response.json({ message: "Received" });
	} catch (e) {
		logger.error(e);
		return new Response("Bad Request", {
			status: 404,
		});
	}
}
