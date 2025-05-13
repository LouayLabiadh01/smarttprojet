import { format } from "date-fns";

import { type Sprint } from "~/schema";

export function getSprintDateRage(sprint: Sprint) {
	if (!sprint.start_date || !sprint.end_date) return "Dates non définies";
	try {
		const startDate = format(new Date(sprint.start_date), "MMM d");
		const endDate = format(new Date(sprint.end_date), "MMM d");
		return `${startDate} - ${endDate}`;
	} catch (e) {
		return "Dates invalides";
	}
}
