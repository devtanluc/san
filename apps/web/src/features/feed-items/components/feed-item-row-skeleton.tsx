import { Skeleton } from "@san/ui/components/skeleton";
import { cn } from "@san/ui/lib/utils";
import type React from "react";

export function FeedItemRowSkeleton({ className, ...props }: React.ComponentProps<typeof Skeleton>) {
	return <Skeleton className={cn("h-12", className)} {...props} />;
}
