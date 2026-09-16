import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@san/ui/components/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import { Home05, SearchMd, Star01 } from "@untitledui/icons";
import type React from "react";

const HOME_MATCH_PATHS = ["/", "/inbox", "/archive", "/trash"];

const navItems = [
	{ title: "Search", url: "/search", icon: SearchMd },
	{
		title: "Home",
		url: "/inbox",
		icon: Home05,
		isActive: (pathname: string) => HOME_MATCH_PATHS.includes(pathname),
	},
	{ title: "Favorites", url: "/favorites", icon: Star01 },
];

export function NavMain({
	...props
}: React.ComponentProps<typeof SidebarMenu>) {
	const { pathname } = useLocation();

	return (
		<SidebarMenu {...props}>
			{navItems.map((item) => {
				const active = item.isActive
					? item.isActive(pathname)
					: pathname === item.url;

				return (
					<SidebarMenuItem key={item.title}>
						<SidebarMenuButton
							isActive={active}
							render={
								<Link to={item.url}>
									<item.icon />
									<span>{item.title}</span>
								</Link>
							}
						/>
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);
}
