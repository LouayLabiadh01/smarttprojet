"use client";

import React, { useMemo } from "react";

import { Filter } from "lucide-react";
import { MinusIcon } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import SimpleTooltip from "~/components/SimpleTooltip";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "~/components/ui/select";
import {
	type TaskProperty,
	getPropertyConfig,
} from "~/features/tasks/config/taskConfigType";
import { cn } from "~/lib/utils";
import { useAppStore } from "~/store/app";
import { useRealtimeStore } from "~/store/realtime";

const FilterAndGroupToggles = () => {
	const [toggleFilters, isFiltersOpen] = useAppStore(
		useShallow((state) => [state.toggleFilters, state.isFiltersOpen]),
	);

	return (
		<div className="flex overflow-hidden rounded-xl border">
			<SimpleTooltip label="Filters" side="left">
				<Button
					variant="outline"
					onClick={toggleFilters}
					size="sm"
					className={cn(
						"flex items-center gap-1 rounded-none border-b-0 border-l-0 border-r border-t-0 bg-transparent px-3 @3xl:px-4",
						isFiltersOpen
							? "bg-accent hover:bg-accent/75"
							: "text-muted-foreground",
					)}
				>
					<Filter className="h-4 w-4" />
					<span className="sr-only">Filtres</span>
					<span className="hidden @3xl:block">
						{isFiltersOpen ? "Fermer" : "Ouvrir"}
					</span>
				</Button>
			</SimpleTooltip>
			<GroupButton />
		</div>
	);
};

const properties = [
	"status",
	"priority",
	"type",
	"assignee",
	"sprintId",
] as TaskProperty[];

const GroupButton = () => {
	const [open, setOpen] = React.useState(false);

	const [groupByBacklog, setGroupByBacklog] = useAppStore(
		useShallow((state) => [state.groupByBacklog, state.setGroupByBacklog]),
	);

	const [assignees, sprints] = useRealtimeStore(
		useShallow((state) => [state.assignees, state.sprints]),
	);

	const groupBy = useMemo(() => {
		return groupByBacklog;
	}, [groupByBacklog]);

	const config = useMemo(() => {
		if (!groupBy || !assignees[0]) return null;
		return getPropertyConfig(groupBy, assignees, sprints);
	}, [groupBy, assignees, sprints]);

	function handleGroupChange(value: string) {
		const setGroupBy = setGroupByBacklog;
		if (value === "none") {
			setGroupByBacklog(null);
		} else if (properties.includes(value as TaskProperty)) {
			setGroupBy(value as TaskProperty);
		} else {
			console.warn("Invalid group value");
		}
	}

	return (
		<Select
			open={open}
			onOpenChange={(open) => setOpen(open)}
			defaultValue="none"
			value={groupBy ? groupBy : "none"}
			onValueChange={(val) => handleGroupChange(val)}
		>
			<SelectTrigger
				asChild
				className="h-min border-b-0 border-l border-r-0 border-t-0 !ring-0 "
			>
				<Button
					variant="outline"
					size="sm"
					className={cn(
						"flex items-center gap-1 rounded-none border-none bg-transparent px-3 text-muted-foreground @3xl:px-4",
						{
							"bg-accent text-white": open,
							"bg-accent text-white hover:bg-accent/75": groupBy,
						},
					)}
				>
					<span className="hidden @3xl:block">Groupe</span>
					{config?.displayName && (
						<span className="text-sm text-muted-foreground">
							[{config.displayName}]
						</span>
					)}
				</Button>
			</SelectTrigger>
			<SelectContent>
				<SelectItem
					value="none"
					className="group/select-item flex items-center justify-between space-x-2 !pl-2 focus:bg-accent/50"
				>
					<div className="flex min-w-[8rem] items-center gap-2">
						<span className="text-muted-foreground group-data-[state=checked]/select-item:hidden">
							<MinusIcon />
						</span>
						<p>Pas de regroupement</p>
					</div>
				</SelectItem>
				{properties.map((property) => {
					const config = getPropertyConfig(
						property,
						assignees,
						sprints,
					);

					if (config.type !== "enum" && config.type !== "dynamic") {
						console.warn(
							"Grouping by non-enum or dynamic property is not supported",
						);
						return null;
					}

					return (
						<SelectItem
							key={config.key}
							value={config.key}
							className="group/select-item flex items-center justify-between space-x-2 !pl-2 focus:bg-accent/50"
						>
							<div className="flex min-w-[8rem] items-center gap-2">
								<span className="text-muted-foreground group-data-[state=checked]/select-item:hidden">
									{config.icon}
								</span>
								<p>{config.displayName}</p>
							</div>
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
};

export default FilterAndGroupToggles;
