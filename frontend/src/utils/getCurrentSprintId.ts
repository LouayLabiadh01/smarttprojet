/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { isAfter, isBefore } from "date-fns";

import { type Sprint } from "~/schema";

export function getCurrentSprintId(sprints: Sprint[]) {
	const currentSprint = sprints.find((sprint) =>
		helperIsSprintActive(sprint),
	);
	return currentSprint ? currentSprint.id : -1;
}

export function helperIsSprintActive(sprint: Sprint) {
	return (
		isAfter(new Date(), new Date(sprint.start_date)) &&
		isBefore(new Date(), new Date(sprint.end_date))
	);
}
