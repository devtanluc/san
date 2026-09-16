import { Button } from "@san/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@san/ui/components/dropdown-menu";
import { Link, useLocation } from "@tanstack/react-router";
import { Archive, ChevronDown, Inbox01, Trash01 } from "@untitledui/icons";
import type { ComponentType, SVGProps } from "react";
import type { NoteStatusFilter } from "@/lib/validators";

type InboxStatusItem = {
	to: NoteStatusFilter;
	label: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const INBOX_STATUS_ITEMS: InboxStatusItem[] = [
	{ to: "inbox", label: "Inbox", icon: Inbox01 },
	{ to: "archive", label: "Archive", icon: Archive },
	{ to: "trash", label: "Trash", icon: Trash01 },
];

export function InboxStatusSwitcher() {
	const { pathname } = useLocation();

	const current =
		INBOX_STATUS_ITEMS.find((item) => item.to === pathname) ??
		INBOX_STATUS_ITEMS[0];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" size="sm">
						{current.label}
						<ChevronDown data-icon="inline-end" className="opacity-70" />
					</Button>
				}
			/>
			<DropdownMenuContent align="start" className="w-40">
				<DropdownMenuGroup className="space-y-0.5">
					{INBOX_STATUS_ITEMS.map((item) => {
						const Icon = item.icon;
						const isActive = item.to === pathname;
						return (
							<DropdownMenuItem
								key={item.to}
								render={
									<Link
										to={`/${item.to}`}
										aria-current={isActive ? "page" : undefined}
										activeProps={{ "data-active": true }}
										className="data-active:bg-accent"
									>
										<Icon />
										<span>{item.label}</span>
									</Link>
								}
							/>
						);
					})}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
