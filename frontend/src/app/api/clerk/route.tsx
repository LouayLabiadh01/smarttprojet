// src/app/api/clerk/route.ts
import { type WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";

import { env } from "~/env.mjs";
import { logger } from "~/lib/logger";

const webhookSecret = env.CLERK_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const headerPayload = headers();
    
    const wh = new Webhook(webhookSecret);
    const event = wh.verify(payload, {
      "svix-id": headerPayload.get("svix-id")!,
      "svix-timestamp": headerPayload.get("svix-timestamp")!,
      "svix-signature": headerPayload.get("svix-signature")!,
    }) as WebhookEvent;

      // Forward to Django backend
    
      await fetch(`${env.DJANGO_API_URL}/users/service/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      

    return Response.json({ message: "Forwarded to Django" });
  } catch (e) {
    logger.error(e);
    return new Response("Bad Request", { status: 400 });
  }
}

