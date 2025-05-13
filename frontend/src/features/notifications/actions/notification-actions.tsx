/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
"use server";
import { logger } from "~/lib/logger";
import { insertNotificationSchema, type NewNotification, type Notification, type Task } from "~/schema";
import { type ActionReturnType } from "~/utils/actionReturnType";
import { throwServerError } from "~/utils/errors";


const BASE_URL = `${process.env.DJANGO_API_URL}/notifications`; // adjust as needed

export type NotificationWithTask = Notification & {
	task: Task | null;
	options?: { isNew: boolean };
};

export async function createNotification(data: NewNotification) {
	try {
		const newNotification = insertNotificationSchema.parse(data);
		console.log("notification",data)

		const res = await fetch(`${BASE_URL}/create/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(newNotification),
		});

		if (!res.ok) throw new Error("Failed to create notification");

		return { success: true, message: "Notification created" };
	} catch (error) {
		logger.error(error);
		throwServerError((error as Error).message || "Error creating notification");
		return { success: false, message: "Error creating notification" };
	}
}

export async function getNotification(notificationId: number) {
	try {
		const res = await fetch(`${BASE_URL}/${notificationId}/`);
		if (!res.ok) throw new Error("Failed to fetch notification");

		return await res.json();
	} catch (error) {
		logger.error(error);
		throwServerError((error as Error).message || "Error fetching notification");
	}
}


export async function getAllNotifications(userId: string): Promise<ActionReturnType<NotificationWithTask[]>> {
	try {
		const res = await fetch(`${BASE_URL}/user/${userId}/`);
		if (!res.ok) throw new Error("Failed to fetch notifications");

		const data1 = await res.json();
		const data = data1.data
		return { data, error: null };
	} catch (error) {
		logger.error(error);
		return { data: null, error: (error as Error).message || "An unknown error occurred" };
	}
}

export async function readNotification(notificationId: number) {
	try {
		await fetch(`${BASE_URL}/${notificationId}/read/`, { method: "PATCH" });
	} catch (error) {
		logger.error(error);
		throwServerError((error as Error).message || "Error marking as read");
	}
}

export async function unreadNotification(notificationId: number) {
	try {
		await fetch(`${BASE_URL}/${notificationId}/unread/`, { method: "PATCH" });
	} catch (error) {
		logger.error(error);
		throwServerError((error as Error).message || "Error marking as unread");
	}
}

export async function deleteNotification(notificationId: number) {
	try {
		await fetch(`${BASE_URL}/${notificationId}/delete/`, { method: "DELETE" });
	} catch (error) {
		logger.error(error);
		throwServerError((error as Error).message || "Error deleting notification");
	}
}

export async function deleteAllNotifications(userId: string) {
	try {
		await fetch(`${BASE_URL}/user/${userId}/delete/`, { method: "DELETE" });
	} catch (error) {
		logger.error(error);
		throwServerError((error as Error).message || "Error deleting all notifications");
	}
}

export async function readAllNotifications(userId: string) {
	try {
		await fetch(`${BASE_URL}/user/${userId}/read/`, { method: "PATCH" });
	} catch (error) {
		logger.error(error);
		throwServerError((error as Error).message || "Error marking all as read");
	}
}
