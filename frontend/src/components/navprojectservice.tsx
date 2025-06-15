/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAllProjects } from "~/actions/project-actions";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const projects = await getAllProjects(userId);
    return Response.json(projects);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}