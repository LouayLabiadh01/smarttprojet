/* eslint-disable import/order */
import React from "react";

import type { UseFormReturn } from "react-hook-form";

import { type TaskFormType } from "~/features/tasks/components/CreateTask";
import { type getPropertyConfig } from "~/features/tasks/config/taskConfigType";
import PropertySelect from "./PropertySelect";
import PropertyStatic from "./PropertyStatic";
import { type VariantPropsType } from "../backlog/Task";




interface Props extends VariantPropsType {
	config: ReturnType<typeof getPropertyConfig>;
	form: UseFormReturn<TaskFormType>;
	onSubmit: (newTask: TaskFormType) => void;
	size: "default" | "icon";
	className?: string;
}

function Property({
	config,
	form,
	onSubmit,
	size,
	variant = "backlog",
	className = "",
}: Props) {
	if (config.type === "text") {
		return (
			<PropertyStatic
				form={form}
				property={config.key}
				variant={variant}
				className={className}
			/>
		);
	}

	if (config.type === "enum" || config.type === "dynamic") {
		return (
			<PropertySelect
				form={form}
				config={config}
				onSubmit={onSubmit}
				size={size}
				className={className}
			/>
		);
	}

	return <div>{config.key}</div>;
}

export default Property;
