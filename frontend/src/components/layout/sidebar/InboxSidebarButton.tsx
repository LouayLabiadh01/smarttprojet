/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import React, { useMemo } from "react";

import { Bell, Inbox } from "lucide-react";

import SidebarButton from "~/components/layout/sidebar/sidebar-button";
import { useRealtimeStore } from "~/store/realtime";
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "~/components/ui/sidebar";
import { Collapsible } from "~/components/ui/collapsible";

type Props = {
	projectId: string;
};

export default function InboxSidebarButton({ projectId }: Props) {
	const notifications = useRealtimeStore((state) => state.notifications);
	const notificationCount = useMemo(() => {
		return notifications.filter((n) => n.readAt === null).length;
	}, [notifications]);

	return (
			<SidebarMenu>
				<Collapsible
					asChild
					className="group/collapsible"
				>
					<SidebarMenuItem>
						<SidebarMenuButton tooltip="Notification">
						{Inbox && <Inbox />}
						<a href={`/project/${projectId}/inbox`}>
					
							<span>Notification</span>
						</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</Collapsible>
			</SidebarMenu>
	);
}
