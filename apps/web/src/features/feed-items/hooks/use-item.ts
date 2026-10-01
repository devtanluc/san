import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function useItem(id: string) {
	return useQuery(trpc.item.byId.queryOptions({ id }));
}

export type ItemDetail = NonNullable<ReturnType<typeof useItem>["data"]>;

function invalidateItemQueries(queryClient: ReturnType<typeof useQueryClient>, id: string) {
	queryClient.invalidateQueries({ queryKey: trpc.item.byId.queryKey({ id }) });
	queryClient.invalidateQueries({ queryKey: trpc.item.list.queryKey() });
}

export function useSetItemFavorite() {
	const queryClient = useQueryClient();

	return useMutation(
		trpc.item.setFavorite.mutationOptions({
			onSuccess: (_data, { id }) => {
				invalidateItemQueries(queryClient, id);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);
}

export function useSummarizeItem() {
	const queryClient = useQueryClient();

	return useMutation(
		trpc.item.summarize.mutationOptions({
			onSuccess: (summary, { id }) => {
				queryClient.setQueryData(trpc.item.byId.queryKey({ id }), (current) =>
					current ? { ...current, summary } : current,
				);
				invalidateItemQueries(queryClient, id);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);
}

export function useFetchFullContent() {
	const queryClient = useQueryClient();

	return useMutation(
		trpc.item.fetchFullContent.mutationOptions({
			onSuccess: (result, { id }) => {
				// Thất bại (chặn bot, cần JS...) thì giữ nguyên nội dung từ feed, không báo lỗi
				if (result.ok) {
					queryClient.invalidateQueries({ queryKey: trpc.item.byId.queryKey({ id }) });
				}
			},
		}),
	);
}
