import { SidebarInset, SidebarProvider } from "@san/ui/components/sidebar";
import type React from "react";
import { AppSidebar } from "./app-sidebar";

export function AppShell({
	children,
	...props
}: React.ComponentProps<typeof SidebarProvider>) {
	return (
		<SidebarProvider {...props}>
			<AppSidebar />
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
