import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@san/ui/components/sidebar";
import { Settings01 } from "@untitledui/icons";
import type React from "react";

export function NavSecondary({
	...props
}: React.ComponentProps<typeof SidebarMenu>) {
	return (
		<SidebarMenu {...props}>
			<SidebarMenuItem>
				<SidebarMenuButton>
					<Settings01 />
					<span>Settings</span>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
