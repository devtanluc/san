import { Button } from "@san/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@san/ui/components/dropdown-menu";
import { ArrowDown, ArrowUp, SwitchVertical01 } from "@untitledui/icons";
import type { NoteSort } from "@/lib/validators";

type SortOption = {
	value: NoteSort;
	label: string;
	direction: "asc" | "desc";
};

const SORT_OPTIONS: SortOption[] = [
	{ value: "updated_desc", label: "Newest updated", direction: "desc" },
	{ value: "updated_asc", label: "Oldest updated", direction: "asc" },
	{ value: "created_desc", label: "Newest created", direction: "desc" },
	{ value: "created_asc", label: "Oldest created", direction: "asc" },
	{ value: "title_asc", label: "Title A → Z", direction: "asc" },
	{ value: "title_desc", label: "Title Z → A", direction: "desc" },
];

function getDirectionIcon(direction: SortOption["direction"]) {
	return direction === "asc" ? ArrowUp : ArrowDown;
}

export function NoteSortDropdown({
	value,
	onChange,
}: {
	value: NoteSort;
	onChange: (sort: NoteSort) => void;
}) {
	const current = SORT_OPTIONS.find((option) => option.value === value);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" size="sm">
						<SwitchVertical01 className="size-4" />
						<span>{current?.label ?? "Sort"}</span>
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="min-w-50">
				<DropdownMenuRadioGroup
					value={value}
					onValueChange={(next) => onChange(next as NoteSort)}
				>
					{SORT_OPTIONS.map((option) => {
						const DirectionIcon = getDirectionIcon(option.direction);
						return (
							<DropdownMenuRadioItem key={option.value} value={option.value}>
								<DirectionIcon className="size-3.5" />
								<span>{option.label}</span>
							</DropdownMenuRadioItem>
						);
					})}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
