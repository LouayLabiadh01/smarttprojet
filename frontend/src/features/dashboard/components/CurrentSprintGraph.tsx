/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable import/order */
"use server";

import React from "react";

import { format, addDays, isBefore, startOfDay, isAfter } from "date-fns";
import dynamic from "next/dynamic";

import { Skeleton } from "~/components/ui/skeleton";
import { logger } from "~/lib/logger";

import { type Result } from "./CurrentSprintAreaGraph";
const CurrentSprintAreaGraph = dynamic(
	() => import("./CurrentSprintAreaGraph"),
	{
		ssr: false,
		loading: () => (
			<Skeleton className="col-span-4 h-[316px] 2xl:col-span-2" />
		),
	},
);

type Props = {
	projectId: number;
};

type Sprint = {
	id: number;
	name: string;
	startDate: string;
	endDate: string;
};

function getMaxDate(date1: string | null, date2: string | null): Date {
	if (!date1 && !date2) return new Date();
	if (!date1) return new Date(date2!);
	if (!date2) return new Date(date1);
	return new Date(date1) > new Date(date2) ? new Date(date1) : new Date(date2);
}

const CurrentSprintGraph = async ({ projectId }: Props) => {
	try {
		const res = await fetch(
			`${process.env.DJANGO_API_URL}/api/projects/${projectId}/current-sprint-graph/`,
			{ cache: "no-store" }
		);

		if (!res.ok) {
			logger.warn("Failed to fetch current sprint data from Django.");
			return;
		}
		logger.info("Successfully fetched sprint data. Parsing JSON...");

		const responseJson = await res.json();

		const { sprint, sprintTasks, taskHistory } = responseJson as {
			sprint: Sprint;
			sprintTasks: {
				id: number;
				status: string;
				points: string;
				insertDate: string | null;
				editedDate: string | null;
			}[];
			taskHistory: {
				propertyValue: string;
				insertedDate: string;
				task: {
					id: number;
					status: string;
					points: string;
				};
			}[];
		};

		if (!sprint || sprintTasks.length === 0) return;

		const parsedSprint = {
			...sprint,
			startDate: new Date(sprint.startDate),
			endDate: new Date(sprint.endDate),
		};

		const tasks = sprintTasks.map((task) => ({
			...task,
			insertDate: getMaxDate(task.insertDate, task.editedDate),
		}));

		const totalSprintPoints = tasks.reduce((sum, t) => {
			return sum + (parseInt(t.points, 10) || 0);
		}, 0);

		const dateArray = [];
		let currentDate = addDays(startOfDay(parsedSprint.startDate), -1);
		while (
			isBefore(currentDate, startOfDay(parsedSprint.endDate)) ||
			currentDate.getTime() === startOfDay(parsedSprint.endDate).getTime()
		) {
			dateArray.push(currentDate);
			currentDate = addDays(currentDate, 1);
		}

		let cumulativeInProgressCount = 0;
		let cumulativeDoneCount = 0;
		const optimalIncrement = totalSprintPoints / (dateArray.length - 1);
		const processedTaskIds = new Set<number>();

		const areaChartData = dateArray.map((date, index) => {
			const taskHistoryForDate = taskHistory.filter(
				(th) => startOfDay(new Date(th.insertedDate)).getTime() === date.getTime()
			);

			const taskIdsInHistory = taskHistoryForDate.map((th) => th.task.id);
			const tasksForDate = tasks
				.filter(
					(task) =>
						startOfDay(task.insertDate).getTime() === date.getTime()
				)
				.filter(
					(task) =>
						!taskIdsInHistory.includes(task.id) &&
						!processedTaskIds.has(task.id)
				);

			taskHistoryForDate.forEach((th) => {
				const points = parseInt(th.task.points, 10) || 0;
				if (processedTaskIds.has(th.task.id)) return;

				if (
					(th.propertyValue === "inprogress" &&
						th.task.status === "inprogress") ||
					(th.propertyValue === "inreview" &&
						th.task.status === "inreview") ||
					th.task.status === "inprogress" ||
					th.task.status === "inreview"
				) {
					processedTaskIds.add(th.task.id);
					cumulativeInProgressCount += points;
				} else if (
					(th.propertyValue === "done" &&
						th.task.status === "done") ||
					th.task.status === "done"
				) {
					processedTaskIds.add(th.task.id);
					cumulativeDoneCount += points;
				}
			});

			tasksForDate.forEach((task) => {
				const points = parseInt(task.points, 10) || 0;
				if (task.status === "inprogress" || task.status === "inreview") {
					processedTaskIds.add(task.id);
					cumulativeInProgressCount += points;
				} else if (task.status === "done") {
					processedTaskIds.add(task.id);
					cumulativeDoneCount += points;
				}
			});

			const result: Result = {
				date: format(date, "MMM d"),
				points: Math.ceil(index * optimalIncrement),
			};

			if (!isAfter(date, new Date())) {
				result.inProgress = cumulativeInProgressCount;
				result.done = cumulativeDoneCount;
			}

			return result;
		});

		return (
			<CurrentSprintAreaGraph
				data={areaChartData}
				currentSprint={{
					id: parsedSprint.id,
					projectId: projectId,
					name: "cur",
					start_date: parsedSprint.startDate,
					end_date: parsedSprint.endDate,
				}}
			/>

		);
	} catch (error: unknown) {
		if (error instanceof Error) {
			logger.error("Error in CurrentSprintGraph:", error.message, error.stack);
		} else {
			logger.error("Unknown error in CurrentSprintGraph:", JSON.stringify(error));
		}
		return null;
	}
	
};

export default CurrentSprintGraph;
