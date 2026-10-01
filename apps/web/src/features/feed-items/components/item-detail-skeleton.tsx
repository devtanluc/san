import { Skeleton } from "@san/ui/components/skeleton";

export function ItemDetailSkeleton() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex flex-col gap-3">
				<Skeleton className="h-8 w-4/5" />
				<Skeleton className="h-4 w-2/5" />
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-11/12" />
				<Skeleton className="h-4 w-4/5" />
			</div>
		</div>
	);
}
