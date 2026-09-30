import { Button } from "@san/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@san/ui/components/dropdown-menu";
import type { ListItemsInput } from "@san/validation";
import { ChevronDownIcon, CircleDotIcon, InboxIcon } from "lucide-react";
import type React from "react";

const HOME_VIEW_OPTIONS: {
	value: NonNullable<ListItemsInput["filter"]>;
	label: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}[] = [
	{ value: "all", label: "All", icon: InboxIcon },
	{ value: "unread", label: "Unread", icon: CircleDotIcon },
];

type StatusSwitcherProps = React.ComponentProps<typeof Button> & {
	value: NonNullable<ListItemsInput["filter"]>;
	onValueChange: (value: NonNullable<ListItemsInput["filter"]>) => void;
};

export function StatusSwitcher({ value, onValueChange, ...props }: StatusSwitcherProps) {
	const selected = HOME_VIEW_OPTIONS.find((option) => option.value === value) ?? HOME_VIEW_OPTIONS[0];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" size="sm" {...props}>
						<span>{selected.label}</span>
						<ChevronDownIcon data-icon="inline-end" className="text-muted-foreground" />
					</Button>
				}
			/>

			<DropdownMenuContent align="start" className="min-w-44">
				<DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
					{HOME_VIEW_OPTIONS.map(({ value: optionValue, label, icon: OptionIcon }) => (
						<DropdownMenuRadioItem key={optionValue} value={optionValue}>
							<OptionIcon />
							<span>{label}</span>
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
