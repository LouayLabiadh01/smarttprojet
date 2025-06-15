/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable import/order */
"use client"

import {
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Home,
  LayoutDashboard,
  Briefcase,
  Archive,
  Users,
  Settings,
  Book,
  ListTodo,
  Building2,
} from "lucide-react"
import { PlusCircledIcon } from "@radix-ui/react-icons"
import dynamic from "next/dynamic"
const UserButton = dynamic(() => import("~/components/user-button/UserButton"), {
  ssr: false,
  loading: () => <Skeleton className="h-[52px] rounded-xl" />,
})
import SimpleTooltip from "~/components/SimpleTooltip"
import { Button } from "~/components/ui/button"
import {
  Sidebar as UiSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  SidebarGroupLabel,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "~/components/ui/sidebar"
import { Skeleton } from "~/components/ui/skeleton"
import CreateTask from "~/features/tasks/components/CreateTask"

import InboxSidebarButton from "./InboxSidebarButton"
import SidebarSearch from "./sidebar-search"
import { TeamSwitcher } from "~/components/team-switcher"
import { NavMain } from "~/components/nav-main"
import NavProject from "~/components/nav-projects"
import { NavUser } from "~/components/nav-user"
import { Collapsible } from "~/components/ui/collapsible"

const data = {
  teams: [
    {
      name: "SmartProject",
      logo: GalleryVerticalEnd,
      plan: "Gestion des Projets",
    },
  ],
  admin: [
    {
      title: "Projets",
      url: "/projects",
      icon: Briefcase,
    },
    {
      title: "Archives",
      url: "/archive",
      icon: Archive,
    },
    {
      title: "Utilisateurs",
      url: "/users",
      icon: Users,
    },
    {
      title: "Rapports",
      url: "/rapport",
      icon: Book,
    },
  ],
  membre: [
    {
      title: "Tableau de bord",
      url: "",
      icon: LayoutDashboard,
    },
    {
      title: "Paramètres",
      url: "/general",
      icon: Settings,
    },
    {
      title: "Tâches",
      url: "/tasks",
      icon: ListTodo,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

interface SidebarProps {
  projectId: string
  isAdmin: boolean
  isChef: boolean
}

const AppSidebar = ({ projectId, isAdmin, isChef }: SidebarProps) => {
  return (
    <UiSidebar className="z-40">
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <div className="mt-1 flex items-center gap-1">
          <SidebarSearch />
          <div className="hidden @sidebar:block">
            <CreateTask projectId={projectId}>
              <div>
                <SimpleTooltip label="Ajouter une tâche">
                  <Button
                    className="aspect-square h-[36px] w-[36px] rounded-md bg-foreground/10 text-muted-foreground hover:text-foreground focus:text-foreground"
                    variant="outline"
                    size="icon"
                  >
                    <PlusCircledIcon />
                    <span className="sr-only">Ajouter une tâche</span>
                  </Button>
                </SimpleTooltip>
              </div>
            </CreateTask>
          </div>
        </div>

        <SidebarGroup>
          {isAdmin && <SidebarGroupLabel>Admin panel</SidebarGroupLabel>}
          {!isAdmin && <SidebarGroupLabel>Platforme</SidebarGroupLabel>}
          <SidebarMenu>
            <Collapsible asChild className="group/collapsible">
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Aceuill">
                  {Home && <Home />}
                  <a href={`/project/${projectId}/home`}>
                    <span>Home</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
          {isAdmin && (
            <SidebarMenu>
              <Collapsible asChild className="group/collapsible">
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Analytique">
                    <Building2 />
                    <a href={`/project/${projectId}/analytics`}>
                      <span>Analytique</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          )}
          <InboxSidebarButton projectId={projectId} />
          {isAdmin && <NavMain items={data.admin} projectId={projectId} />}
          {!isAdmin && <NavMain items={data.membre} projectId={projectId} />}
        </SidebarGroup>
        <NavProject />

        {/*<div>
					<div className="flex min-h-[57px] items-center">
						<Logo />
					</div>
					<div className="mb-4 mt-1 flex items-center gap-1">
						<SidebarSearch />
						{isAdmin && isChef && (
						<div className="hidden @sidebar:block">
							<CreateTask projectId={projectId}>
								<div>
									<SimpleTooltip label="Ajouter une tâche">
										<Button
											className="aspect-square h-[36px] w-[36px] rounded-md bg-foreground/10 text-muted-foreground hover:text-foreground focus:text-foreground"
											variant="outline"
											size="icon"
										>
											<PlusCircledIcon />
											<span className="sr-only">
												Ajouter une tâche
											</span>
										</Button>
									</SimpleTooltip>
								</div>
							</CreateTask>
						</div>)}
					</div>
					{ isAdmin && (<SidebarButton
						label="Aceuill"
						icon={
							<LayoutDashboardIcon className="h-5 w-5 min-w-5" />
						}
						url={`/Home`}
					/>)} 
					{ !isAdmin && (<SidebarButton
						label="Tableau de bord"
						icon={
							<LayoutDashboardIcon className="h-5 w-5 min-w-5" />
						}
						url={`/project/${projectId}`}
					/>)}
					
					{ !isAdmin && (<TaskViews projectId={projectId} />) }
					<SidebarButton
						label="Projets"
						icon={<GearIcon className="h-5 w-5 min-w-5" />}
						url={`/Projets`}
					/>
					{ !isAdmin && (<SidebarButton
						label="Paramètres"
						icon={<GearIcon className="h-5 w-5 min-w-5" />}
						url={`/settings/project/${projectId}/general`}
					/>)}
					{isAdmin && (
					<SidebarButton
						label="Archives"
						icon={
						<HiArchiveBox className="h-5 w-5 min-w-5" />}
						url={`/project/${projectId}/archive`}
					/>
					)}
					{isChef && (
					<SidebarButton
						label="Rapports"
						icon={<HiDocumentText className="h-5 w-5 min-w-5" />}
						url={`/project/${projectId}/rapport`}
					/>)}
					{isAdmin && (
					<SidebarButton
						label="Utilisateurs"
						icon={<HiDocumentText className="h-5 w-5 min-w-5" />}
						url={`/project/${projectId}/utilisateurs`}
					/>)}
				</div>
				{ !isAdmin && (<div className="min-h-20 shrink overflow-x-hidden overflow-y-scroll">
					<ProjectListWrapper
						currentProjectId={parseInt(projectId)}
					/>
				</div>)}
				<SidebarFooter className="p-0 pb-4">
					<UserButton size="large" />
				</SidebarFooter>*/}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </UiSidebar>
  )
}

export default AppSidebar
