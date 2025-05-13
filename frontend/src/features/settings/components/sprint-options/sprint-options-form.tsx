/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import React, { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { isEqual } from "date-fns";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateSprintsForProject } from "~/actions/sprint-actions";
import { Button } from "~/components/ui/button";
import { type Project } from "~/schema";

import SprintOptions from "./sprint-options";
  

type Props = {
	project: Project;
};

export type ProjectSprintOptions = Pick<
	Project,
	"sprint_duration" | "sprint_start"
>;
const ProjectSprintOptionsSchema = z.object({
	sprint_duration: z.number().min(1).max(4),
	sprint_start: z.date(),
});

const SprintOptionsForm = ({ project }: Props) => {
	const form = useForm<ProjectSprintOptions>({
		mode: "onChange",
		resolver: zodResolver(ProjectSprintOptionsSchema),
		defaultValues: {
			sprint_duration: project.sprint_duration,
			sprint_start: new Date(project.sprint_start),
		},
	});

	useEffect(() => {
		form.reset({
			sprint_duration: project.sprint_duration,
			sprint_start: new Date(project.sprint_start),
		});
	}, [project]);

	const [loading, setLoading] = React.useState(false);
	async function onSubmit(formData: ProjectSprintOptions) {
		setLoading(true);
		const result = await updateSprintsForProject(
			project.id,
			formData.sprint_duration,
			formData.sprint_start,
		);
		setLoading(false);
		if (result) {
			toast.success("Updated sprint options");
		} else {
			toast.error("Failed to update sprint options");
			form.reset();
		}
	}

	return (
		<form onSubmit={form.handleSubmit(onSubmit)}>
			<SprintOptions form={form} />
			<div className="mt-4 flex w-full items-center justify-end gap-4">
				<Button
					size="sm"
					variant="secondary"
					type="button"
					onClick={(e) => {
						e.preventDefault();
						form.reset();
					}}
					disabled={
						!form.formState.isDirty || form.formState.isSubmitting
					}
				>
					Cancel
				</Button>
				<Button
					disabled={
						!form.formState.isValid ||
						(form.watch("sprint_duration") === project.sprint_duration &&
							isEqual(
								new Date(form.watch("sprint_start")),
								new Date(project.sprint_start),
							)) ||
						loading
					}
					type="submit"
					size="sm"
				>
					{loading ? "Saving" : "Save"}
					{loading ? (
						<Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
					) : null}
				</Button>
			</div>
		</form>
	);
};

export default SprintOptionsForm;
