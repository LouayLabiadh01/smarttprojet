import { GitHubLogoIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { AlertTriangle } from "lucide-react";
import { AiOutlineTeam } from "react-icons/ai";
import { PiPersonSimpleRun } from "react-icons/pi";

import type { UserRole } from "~/schema";

export type settingsConfig = {
	title: string;
	icon: JSX.Element;
	allowedRoles?: UserRole[];
	className?: string;
};

export const generalSettings: settingsConfig[] = [
	{
		title: "General",
		icon: <InfoCircledIcon />,
		allowedRoles: ["owner", "admin"],
	},
	/*{
		title: "GitHub",
		icon: <GitHubLogoIcon />,
		allowedRoles: ["owner"],
	},*/
	{
		title: "Sprints",
		icon: <PiPersonSimpleRun />,
	},
	{
		title: "Members",
		icon: <AiOutlineTeam />,
		allowedRoles: ["owner", "admin"],
	},
	{
		title: "Invite",
		icon: <AiOutlineTeam />,
		allowedRoles: ["owner", "admin"],
	},
	{
		title: "Danger Zone",
		icon: <AlertTriangle />,
		className: "text-red-500",
	},
];
