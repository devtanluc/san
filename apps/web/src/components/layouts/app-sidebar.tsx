import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@san/ui/components/sidebar";
import type React from "react";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<NavMain />
			</SidebarHeader>

			<SidebarContent>content</SidebarContent>

			<SidebarFooter>
				<NavSecondary />
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
