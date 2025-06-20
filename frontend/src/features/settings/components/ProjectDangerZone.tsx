/* eslint-disable import/order */
import React from "react";

import Permission from "~/components/Permission";
import { type Project } from "~/schema"; 

import DeleteProjectButton from "./DeleteProjectButton";
import LeaveProjectButton from "./LeaveProjectButton";

type Props = {
	project: Project;
};

const ProjectDangerZone = ({ project }: Props) => {
	return (
		<div className="flex items-center gap-3">
			<Permission projectId={project.id} allowRoles={["member", "admin"]}>
				<LeaveProjectButton
					projectName={project.name}
					projectId={project.id}
				/>
			</Permission>
			<Permission projectId={project.id} allowRoles={["owner"]}>
				<DeleteProjectButton
					projectName={project.name}
					projectId={project.id}
				/>
			</Permission>
		</div>
	);
};

export default ProjectDangerZone;
