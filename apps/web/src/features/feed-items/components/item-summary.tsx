import { Button } from "@san/ui/components/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@san/ui/components/empty";
import { Spinner } from "@san/ui/components/spinner";
import { RefreshCwIcon, SparklesIcon } from "lucide-react";
import { Streamdown } from "streamdown";
import type { ItemDetail } from "@/features/feed-items/hooks/use-item";

type Props = {
	item: ItemDetail;
	isGenerating: boolean;
	onGenerate: (force?: boolean) => void;
};

export function ItemSummary({ item, isGenerating, onGenerate }: Props) {
	const summary = item.summary;
	const canGenerate = Boolean(item.contentClean);

	if (isGenerating && !summary) {
		return (
			<div className="flex items-center gap-2 text-muted-foreground text-sm">
				<Spinner />
				<span>Generating summary…</span>
			</div>
		);
	}

	if (!summary) {
		return (
			<Empty className="min-h-56 border p-8">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<SparklesIcon />
					</EmptyMedia>
					<EmptyTitle>No summary yet</EmptyTitle>
					<EmptyDescription>
						{canGenerate
							? "Generate an AI summary of this article."
							: "This item has no content to summarize."}
					</EmptyDescription>
				</EmptyHeader>
				{canGenerate ? (
					<EmptyContent>
						<Button onClick={() => onGenerate()} disabled={isGenerating}>
							{isGenerating ? (
								<Spinner data-icon="inline-start" />
							) : (
								<SparklesIcon data-icon="inline-start" />
							)}
							Generate summary
						</Button>
					</EmptyContent>
				) : null}
			</Empty>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between gap-2">
				<p className="text-muted-foreground text-xs">
					{summary.model ? `${summary.model} · ` : ""}
					{summary.generatedAt
						? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
								new Date(summary.generatedAt),
							)
						: null}
				</p>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onGenerate(true)}
					disabled={isGenerating || !canGenerate}
				>
					{isGenerating ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
					Regenerate
				</Button>
			</div>
			<div className="text-sm leading-relaxed">
				<Streamdown>{summary.text}</Streamdown>
			</div>
		</div>
	);
}
