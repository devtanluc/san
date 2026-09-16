import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@san/ui/components/sidebar";
import { Home05, SearchMd, Star01 } from "@untitledui/icons";
import type React from "react";

export function NavMain({
	...props
}: React.ComponentProps<typeof SidebarMenu>) {
	return (
		<SidebarMenu {...props}>
			<SidebarMenuItem>
				<SidebarMenuButton>
					<SearchMd />
					<span>Search</span>
				</SidebarMenuButton>
			</SidebarMenuItem>

			<SidebarMenuItem>
				<SidebarMenuButton>
					<Home05 />
					<span>Home</span>
				</SidebarMenuButton>
			</SidebarMenuItem>

			<SidebarMenuItem>
				<SidebarMenuButton>
					<Star01 />
					<span>Favorites</span>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
