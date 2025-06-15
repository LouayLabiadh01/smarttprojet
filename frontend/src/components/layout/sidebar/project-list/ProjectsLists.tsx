/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import React from "react";

import { auth } from "@clerk/nextjs/server";

import { getAllProjects } from "~/actions/project-actions";
import { throwServerError } from "~/utils/errors";
import { getUser } from "~/actions/user-actions";
import dynamic from "next/dynamic";

// dynamic import to avoid client component issue
const NavProjectsWrapper = dynamic(
  () => import("~/components/layout/sidebar/project-list/NavProjectsWrapper").then(mod => mod.default),
  { ssr: false }
);




async function ProjectsList() {
    const { userId }: { userId: string | null } = await auth();
    if (!userId) return null;
    const projects = await getAllProjects(userId);
    if (!projects) {
        throwServerError("Error Loading Projects");
        return;
    }

    const user = await getUser(userId);
    const isAdmin = user.role === "Admin";

    return (
        <NavProjectsWrapper projects={projects}/>
    );
}

export default ProjectsList;
