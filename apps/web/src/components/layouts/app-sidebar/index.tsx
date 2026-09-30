import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
	SidebarTrigger,
} from "@san/ui/components/sidebar";
import type React from "react";
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";
import { NavFeeds } from "./nav-feeds";
import { NavMain } from "./nav-main";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar {...props}>
			<SidebarHeader className="pt-0">
				<div className="flex h-(--header-height) items-center justify-between">
					<h3 className="px-2 font-medium text-sm">san.</h3>
					<SidebarTrigger />
				</div>

				<NavMain />
			</SidebarHeader>
			<SidebarContent>
				<NavFeeds />
			</SidebarContent>
			<SidebarFooter>
				<ModeToggle />
				<UserMenu />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
