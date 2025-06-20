/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable import/order */
import {
	ArrowDownIcon,
	ArrowRightIcon,
	ArrowUpIcon,
	CheckCircledIcon,
	EyeOpenIcon,
	GitHubLogoIcon,
	PersonIcon,
	PieChartIcon,
	RadiobuttonIcon,
} from "@radix-ui/react-icons";
import { Layers } from 'lucide-react';
import { type VariantProps, cva } from "class-variance-authority";
import _ from "lodash";
import {
	Activity,
	AlertOctagon,
	ArrowUpDown,
	Asterisk,
	Beaker,
	BugIcon,
	CircleDashed,
	Clock,
	Dot,
	Feather,
	LayoutList,
	Minus,
	Search,
	Text,
} from "lucide-react";
import {
	TbHexagonNumber1,
	TbHexagonNumber2,
	TbHexagonNumber3,
	TbHexagonNumber4,
	TbHexagonNumber5,
	TbHexagon,
} from "react-icons/tb";
import { z } from "zod";

import UserProfilePicture from "~/components/UserProfilePicture";
import {
	getSprintProgress,
	SprintProgressCircle,
} from "~/features/tasks/utils/getSprintIcon";
import { type User, type Task, type Sprint, selectTaskSchema } from "~/schema";
import {
	getCurrentSprintId,
	helperIsSprintActive,
} from "~/utils/getCurrentSprintId";
import { getSprintDateRage } from "~/utils/getSprintDateRange";

export type TaskProperty = keyof Task;
type StaticProperty = Extract<
	TaskProperty,
	| "id"
	| "insertedDate"
	| "lastEditedAt"
	| "projectId"
	| "backlogOrder"
	| "branchName"
>;
type EnumProperty = Extract<
	TaskProperty,
	"status" | "points" | "priority" | "type"
>;
type DynamicProperty = Extract<TaskProperty, "sprintId" | "assignee">;
type TextProperty = Extract<TaskProperty, "title" | "description" | "subTask">;

export const taskProperties: TaskProperty[] = [
	"id",
	"title",
	"description",
	"status",
	"points",
	"priority",
	"type",
	"assignee",
	"sprintId",
	"lastEditedAt",
	"insertedDate",
	"projectId",
	"backlogOrder",
	"branchName",
	"subTask"
] as const;

export const taskVariants = cva(["transition-all duration-200"], {
	variants: {
		color: {
			grey: "text-neutral-300 bg-neutral-800 hover:text-neutral-50 focus:text-neutral-50 hover:bg-neutral-700/60 focus:bg-neutral-700/60",
			green: "text-lime-300 bg-lime-700/80 hover:text-lime-50 focus:text-lime-50 data-[state=open]:text-lime-50 hover:bg-lime-800/80 focus:bg-lime-800/80 data-[state=open]:bg-lime-800/80",
			amber: "text-yellow-300 bg-yellow-700/80 hover:text-yellow-50 focus:text-yellow-50 data-[state=open]:text-yellow-50 hover:bg-yellow-800/80 focus:bg-yellow-800/80 data-[state=open]:bg-yellow-800/80",
			blue: "text-sky-200 bg-sky-700/60 hover:text-sky-50 focus:text-sky-50 data-[state=open]:text-sky-50 hover:bg-sky-800/60 focus:bg-sky-800/60 data-[state=open]:bg-sky-800/60",
			teal: "text-[#AFECEF] bg-[#134E4A]/80 hover:text-[#CCFBF1] focus:text-[#CCFBF1] data-[state=open]:text-[#CCFBF1] hover:bg-[#134E4A]/60 focus:bg-[#134E4A]/60 data-[state=open]:bg-[#134E4A]/60",
			violet: "text-indigo-200 bg-indigo-800/50 hover:text-indigo-50 focus:text-indigo-50 data-[state=open]:text-indigo-50 hover:bg-indigo-900/50 focus:bg-indigo-900/50 data-[state=open]:bg-indigo-900/50",
			red: "text-[#FECACA] bg-[#7F1D1D]/80 hover:text-[#FEE2E2] focus:text-[#FEE2E2] data-[state=open]:text-[#FEE2E2] hover:bg-[#7F1D1D]/60 focus:bg-[#7F1D1D]/60 data-[state=open]:bg-[#7F1D1D]/60",
		},
		context: {
			default: "",
			menu: "!bg-transparent",
		},
	},
	compoundVariants: [
		// Border styles for default context
		{
			color: "grey",
			context: "default",
			class: "border border-neutral-700/50 hover:border-transparent focus:border-transparent data-[state=open]:border-transparent",
		},
		{
			color: "green",
			context: "default",
			class: "border border-lime-300/10 hover:border-transparent focus:border-transparent data-[state=open]:border-transparent",
		},
		{
			color: "amber",
			context: "default",
			class: "border border-yellow-300/10 hover:border-transparent focus:border-transparent data-[state=open]:border-transparent",
		},
		{
			color: "blue",
			context: "default",
			class: "border border-sky-200/10 hover:border-transparent focus:border-transparent data-[state=open]:border-transparent",
		},
		{
			color: "teal",
			context: "default",
			class: "border border-[#115E59]/50 hover:border-transparent focus:border-transparent data-[state=open]:border-transparent",
		},
		{
			color: "violet",
			context: "default",
			class: "border border-indigo-200/10 hover:border-transparent focus:border-transparent data-[state=open]:border-transparent",
		},
		{
			color: "red",
			context: "default",
			class: "border border-[#991B1B]/50 hover:border-transparent focus:border-transparent data-[state=open]:border-transparent",
		},
	],
	defaultVariants: {
		color: "grey",
		context: "default",
	},
});

export type VariantPropsType = VariantProps<typeof taskVariants>;

export type Color = Exclude<VariantPropsType["color"], null | undefined>;

export type Option<T> = {
	key: T;
	displayName: string;
	icon: JSX.Element;
	color: Color;
};

type TaskGeneric<T> = {
	key: T;
	displayName: string;
	icon: JSX.Element;
};

type TaskConfig = {
	[P in
		| TextProperty
		| EnumProperty
		| DynamicProperty
		| StaticProperty]: P extends TextProperty
		? TaskGeneric<P> & {
				type: "text";
			}
		: P extends EnumProperty
			? TaskGeneric<P> & {
					type: "enum";
					options: Option<Task[P]>[];
				}
			: P extends DynamicProperty
				? TaskGeneric<P> & {
						type: "dynamic";
						options: Option<string>[];
					}
				: TaskGeneric<P> & {
						type: "static";
					};
};

export const taskConfig: TaskConfig = {
	id: {
		key: "id",
		displayName: "ID",
		icon: <Dot className="h-4 w-4" />,
		type: "static",
	},
	title: {
		key: "title",
		displayName: "Titre",
		icon: <Minus className="h-4 w-4" />,
		type: "text",
	},
	description: {
		key: "description",
		displayName: "Description",
		icon: <Text className="h-4 w-4" />,
		type: "text",
	},
	status: {
		key: "status",
		displayName: "Status",
		icon: <CircleDashed className="h-4 w-4" />,
		type: "enum",
		options: [
			{
				key: "backlog",
				displayName: "En attente",
				icon: <CircleDashed className="h-4 w-4" />,
				color: "grey",
			},
			{
				key: "todo",
				displayName: "A Faire",
				icon: <RadiobuttonIcon className="h-4 w-4" />,
				color: "green",
			},
			{
				key: "inprogress",
				displayName: "En cours",
				icon: <PieChartIcon className="h-4 w-4" />,
				color: "amber",
			},
			{
				key: "inreview",
				displayName: "En revue",
				icon: <EyeOpenIcon className="h-4 w-4" />,
				color: "blue",
			},
			{
				key: "done",
				displayName: "Fait",
				icon: <CheckCircledIcon className="h-4 w-4" />,
				color: "teal",
			},
		],
	},
	points: {
		key: "points",
		displayName: "Points",
		icon: <TbHexagon className="h-4 w-4" />,
		type: "enum",
		options: [
			{
				key: "0",
				displayName: "Aucune estimation",
				icon: <TbHexagon className="h-4 w-4" />,
				color: "grey",
			},
			{
				key: "1",
				displayName: "1 Point",
				icon: <TbHexagonNumber1 className="h-4 w-4" />,
				color: "grey",
			},
			{
				key: "2",
				displayName: "2 Points",
				icon: <TbHexagonNumber2 className="h-4 w-4" />,
				color: "grey",
			},
			{
				key: "3",
				displayName: "3 Points",
				icon: <TbHexagonNumber3 className="h-4 w-4" />,
				color: "grey",
			},
			{
				key: "4",
				displayName: "4 Points",
				icon: <TbHexagonNumber4 className="h-4 w-4" />,
				color: "grey",
			},
			{
				key: "5",
				displayName: "5 Points",
				icon: <TbHexagonNumber5 className="h-4 w-4" />,
				color: "grey",
			},
		],
	},
	priority: {
		key: "priority",
		displayName: "Priorité",
		icon: <ArrowUpDown className="h-4 w-4" />,
		type: "enum",
		options: [
			{
				key: "none",
				displayName: "Aucun",
				icon: <Minus className="h-4 w-4" />,
				color: "grey",
			},
			{
				key: "low",
				displayName: "Faible",
				icon: <ArrowDownIcon className="h-4 w-4" />,
				color: "violet",
			},
			{
				key: "medium",
				displayName: "Moyen",
				icon: <ArrowRightIcon className="h-4 w-4" />,
				color: "blue",
			},
			{
				key: "high",
				displayName: "Haut",
				icon: <ArrowUpIcon className="h-4 w-4" />,
				color: "amber",
			},
			{
				key: "critical",
				displayName: "Critique",
				icon: <AlertOctagon className="h-4 w-4" />,
				color: "red",
			},
		],
	},
	type: {
		key: "type",
		displayName: "Type",
		type: "enum",
		icon: <Asterisk className="h-4 w-4" />,
		options: [
			{
				key: "task",
				displayName: "Tâche",
				icon: <LayoutList className="h-4 w-4" />,
				color: "grey",
			},
			{
				key: "feature",
				displayName: "Fonctionnalité",
				icon: <Feather className="h-4 w-4" />,
				color: "grey",
			},
			{
				key: "improvement",
				displayName: "Amélioration",
				icon: <Activity className="h-4 w-4" />,
				color: "grey",
			},
			{
				key: "research",
				displayName: "Recherche",
				icon: <Search className="h-4 w-4" />,
				color: "grey",
			},
			{
				key: "testing",
				displayName: "Testing",
				icon: <Beaker className="h-4 w-4" />,
				color: "grey",
			},
			{
				key: "bug",
				displayName: "Bug",
				icon: <BugIcon className="h-4 w-4" />,
				color: "grey",
			},
		],
	},
	assignee: {
		key: "assignee",
		displayName: "Assigné(e)",
		type: "dynamic",
		icon: <PersonIcon className="h-4 w-4" />,
		options: [
			{
				key: "unassigned",
				displayName: "Non attribué",
				icon: <PersonIcon className="h-4 w-4" />,
				color: "grey",
			},
		],
	},
	sprintId: {
		key: "sprintId",
		displayName: "Sprint",
		type: "dynamic",
		icon: <SprintProgressCircle progress={1} />,
		options: [
			{
				key: "-1",
				displayName: "Pas de sprint",
				icon: <SprintProgressCircle progress={0} />,
				color: "grey",
			},
		],
	},
	lastEditedAt: {
		key: "lastEditedAt",
		displayName: "Dernière modification",
		icon: <Clock className="h-4 w-4" />,
		type: "static",
	},
	insertedDate: {
		key: "insertedDate",
		displayName: "Inséré",
		icon: <Clock className="h-4 w-4" />,
		type: "static",
	},
	projectId: {
		key: "projectId",
		displayName: "Projet",
		icon: <Dot className="h-4 w-4" />,
		type: "static",
	},
	backlogOrder: {
		key: "backlogOrder",
		displayName: "Order en attente",
		icon: <Dot className="h-4 w-4" />,
		type: "static",
	},
	branchName: {
		key: "branchName",
		displayName: "Nom de Branch",
		icon: <GitHubLogoIcon className="h-4 w-4" />,
		type: "static",
	},
	subTask: {
		key: "subTask",
		displayName: "Sous-tâche de",
		icon: <GitHubLogoIcon className="h-4 w-4" />,
		type: "text",
	}
};

function getDynamicConfig(assignees: User[], sprints: Sprint[]) {
	const config = _.cloneDeep(taskConfig);

	const assigneeColor: Color = "grey";

	config.assignee.options = [
		...taskConfig.assignee.options,
		...assignees.map((assignee) => ({
			key: assignee.username,
			displayName: assignee.username,
			icon: (
				<UserProfilePicture size={18} src={assignee.profilePicture} />
			),
			color: assigneeColor,
		})),
	];

	const currentSprintId = getCurrentSprintId(sprints);
	const currentSprintIndex = sprints
		.map((s) => s.id)
		.indexOf(currentSprintId);
	const sprintsToDisplay = sprints.filter(
		(_, i) => currentSprintIndex - 2 < i && i < currentSprintIndex + 2,
	);

	config.sprintId.options = [
		...taskConfig.sprintId.options,
		...sprintsToDisplay.map((sprint) => {
			const progress = getSprintProgress(sprint);

			const isActive = helperIsSprintActive(sprint);
			const color: Color = isActive ? "teal" : "violet";

			return {
				key: sprint.id.toString(),
				displayName: `${sprint.name} [${getSprintDateRage(sprint)}]`,
				icon: (
					<SprintProgressCircle
						progress={progress}
						className="h-4 w-4"
					/>
				),
				color: color,
			};
		}),
	];

	return config;
}

// Implementation
export function getPropertyConfig(
	property: TaskProperty,
	assignees?: User[],
	sprints?: Sprint[],
) {
	let config = taskConfig[property];

	// Check if property is 'sprintId' or 'assignee', and ensure additional parameters are provided
	if (
		(property === "assignee" || property === "sprintId") &&
		assignees &&
		sprints
	) {
		config = getDynamicConfig(assignees, sprints)[property];
	} else if (property === "assignee" || property === "sprintId") {
		console.warn(
			`getPropertyConfig: ${property} requires additional parameters to be provided`,
		);
	}

	return config;
}

/**
 * Given a value of a task property, return the corresponding option from the taskConfig
 * Example: "backlog" -> { key: "backlog", displayName: "Backlog", icon: <CircleDashed />, color: "null" }
 *
 * @param optionKey
 * @returns
 */
export function getEnumOptionByKey(optionKey: string) {
	for (const property in taskConfig) {
		const config = taskConfig[property as keyof typeof taskConfig];

		if (config.type === "enum" && config.options) {
			const option = config.options.find((opt) => opt.key === optionKey);

			if (option) {
				return option;
			}
		}
	}

	console.warn(
		`getEnumOptionByKey: Option key '${optionKey}' was not found in any enum properties.`,
	);
	return null;
}

export const schemaValidators = {
	id: z.number().min(1),
	title: z
		.string()
		.min(1, "Title must be at least one character long.")
		.max(225, "Title must be at most 225 characters long."),
	description: z.string(),
	status: selectTaskSchema.shape.status,
	points: selectTaskSchema.shape.points,
	priority: selectTaskSchema.shape.priority,
	type: selectTaskSchema.shape.type,
	assignee: z
		.string()
		.max(225, "Assignee must be at most 225 characters long."),
	projectId: z.number().min(1),
	sprintId: z.string(),
	backlogOrder: z.number().min(0),
	lastEditedAt: selectTaskSchema.shape.lastEditedAt,
	insertedDate: selectTaskSchema.shape.insertedDate,
	branchName: z.string().nullable(),
	subTask: z.string().optional().default(""),
};

export function buildValidator(keys: TaskProperty[]) {
	return z.object(
		Object.fromEntries(
			keys.map((key) => {
				return [key, schemaValidators[key]];
			}),
		),
	);
}

export const defaultValues = {
	title: "",
	description: "",
	status: "backlog",
	points: "1",
	priority: "none",
	type: "task",
	assignee: "unassigned",
	sprintId: "-1",
	id: 0,
	projectId: 0,
	backlogOrder: 0,
	lastEditedAt: new Date(),
	insertedDate: new Date(),
	subTask: "",
} as const;

type TaskOptions = {
	isPending?: boolean;
	isNew?: boolean;
};

export interface StatefulTask extends Task {
	options: TaskOptions;
	comments: number;
}

export const CreateTaskSchema = z.object({
	title: schemaValidators.title,
	description: schemaValidators.description,
	status: schemaValidators.status,
	points: schemaValidators.points,
	priority: schemaValidators.priority,
	type: schemaValidators.type,
	assignee: schemaValidators.assignee.transform((val) =>
		val === "unassigned" ? null : val,
	),
	projectId: schemaValidators.projectId,
	sprintId: schemaValidators.sprintId.transform((val) => parseInt(val)),
	backlogOrder: schemaValidators.backlogOrder,
	branchName: schemaValidators.branchName,
});
