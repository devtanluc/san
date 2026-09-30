"use client";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@san/ui/components/sidebar";
import { Link } from "@tanstack/react-router";
import { HomeIcon, type LucideIcon } from "lucide-react";

const NAV_MAIN_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
	{ to: "/home", label: "Home", icon: HomeIcon },
];

export function NavMain({ ...props }: React.ComponentProps<typeof SidebarMenu>) {
	return (
		<SidebarMenu {...props}>
			{NAV_MAIN_ITEMS.map(({ to, label, icon: Icon }) => (
				<SidebarMenuItem key={to}>
					<SidebarMenuButton
						render={
							<Link
								to={to}
								activeProps={{
									"data-active": true,
								}}
							>
								<Icon />
								<span>{label}</span>
							</Link>
						}
					/>
				</SidebarMenuItem>
			))}
		</SidebarMenu>
	);
}
