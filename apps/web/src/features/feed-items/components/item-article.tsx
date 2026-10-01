import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@san/ui/components/empty";
import type { ItemDetail } from "@/features/feed-items/hooks/use-item";

type Props = {
	item: ItemDetail;
	isLoadingFull?: boolean;
};

export function ItemArticle({ item, isLoadingFull = false }: Props) {
	if (!item.contentClean) {
		return (
			<Empty className="min-h-56 p-8">
				<EmptyHeader>
					<EmptyTitle>{isLoadingFull ? "Loading article…" : "No content"}</EmptyTitle>
					<EmptyDescription>
						{isLoadingFull
							? "Fetching the full text from the original page."
							: "This item has no readable content."}
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	const paragraphs = item.contentClean.split(/\n{2,}/).filter(Boolean);

	return (
		<div className="flex flex-col gap-4">
			{item.imageUrl ? (
				<img src={item.imageUrl} alt="" className="max-h-72 w-full rounded-lg object-cover" />
			) : null}
			{/* <div className="flex flex-col gap-3 text-sm leading-relaxed">
				{paragraphs.map((paragraph, index) => (
					<p key={index} className="whitespace-pre-wrap">
						{paragraph}
					</p>
				))}
			</div> */}
			{item.contentHtml ? (
				<div
					className="typeset"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: HTML đã qua sanitize-html phía server
					dangerouslySetInnerHTML={{ __html: item.contentHtml }}
				/>
			) : (
				<div className="flex flex-col gap-3 text-sm leading-relaxed">
					{paragraphs.map((paragraph, index) => (
						<p key={index} className="whitespace-pre-wrap">
							{paragraph}
						</p>
					))}
				</div>
			)}
			{isLoadingFull ? (
				<p className="animate-pulse text-muted-foreground text-sm">Loading full article…</p>
			) : null}
		</div>
	);
}
