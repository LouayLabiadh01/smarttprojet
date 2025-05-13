/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from "react";

import { BellIcon } from "lucide-react";
import { redirect } from "next/navigation";

import SimpleTooltip from "~/components/SimpleTooltip";
import { getNotification } from "~/features/notifications/actions/notification-actions";
import { TaskPageWrapper } from "~/features/tasks/components/page/TaskPageWrapper";
import constructToastURL from "~/lib/toast/global-toast-url-constructor";
import { formatDateRelative, formatDateVerbose } from "~/utils/dateFormatters";

type Params = {
	params: {
		projectId: string;
		notificationId: string;
	};
};

export default async function InboxPage({
	params: { projectId, notificationId },
}: Params) {
	const notification = await getNotification(parseInt(notificationId));

	if (!notification) {
		redirect(
			constructToastURL(
				"Issue loading notification",
				"error",
				`/project/${projectId}/inbox`,
			),
		);
}


	if (!notification.taskId) {
		return (
			<div className="flex w-full justify-center py-[57px]">
				<div className="flex flex-col gap-2 rounded-lg bg-foreground/5 px-6 py-6">
					<div className="flex items-center gap-2 border-b pb-2">
						<BellIcon className="h-4 w-4" />
						<p className="font-medium">System Notification</p>
						<SimpleTooltip
							label={formatDateVerbose(new Date(notification.date))}
						>
							<p
								suppressHydrationWarning
								className="flex-shrink-0 whitespace-nowrap text-muted-foreground"
							>
								{formatDateRelative(new Date(notification.date))}
							</p>
						</SimpleTooltip>
					</div>
					<div className="rounded-lg bg-accent p-4">
						{notification.message}
					</div>
				</div>
			</div>
		);
	}

	return (
		<TaskPageWrapper
			taskId={notification.taskId.toString()}
			projectId={notification.projectId.toString()}
			context="inbox"
		/>
	);
}
