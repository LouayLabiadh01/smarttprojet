/* eslint-disable import/order */
"use client";

import  NavProjects  from "~/components/nav-projects";

type Props = {
  projects:[];
};

export default function NavProjectsWrapper({ projects }: Props) {
  return <NavProjects />;
}
