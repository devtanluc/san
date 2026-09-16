import { SidebarInset, SidebarProvider } from "@san/ui/components/sidebar";
import type React from "react";
import { AppSidebar } from "./app-sidebar";

export function AppShell({
	children,
	...props
}: React.ComponentProps<typeof SidebarProvider>) {
	return (
		<SidebarProvider
			style={
				{
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
			{...props}
		>
			<AppSidebar />
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
