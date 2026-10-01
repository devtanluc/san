import { useMutation, useMutationState, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

export function useFeeds() {
	return useQuery(trpc.feed.list.queryOptions());
}

export function useSyncFeed() {
	const queryClient = useQueryClient();

	return useMutation(
		trpc.feed.sync.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.feed.list.queryKey(),
				});
			},
		}),
	);
}

export function useDeleteFeed() {
	const queryClient = useQueryClient();

	return useMutation(
		trpc.feed.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.feed.list.queryKey(),
				});
			},
		}),
	);
}

export function useSyncingFeedIds() {
	return useMutationState({
		filters: {
			mutationKey: trpc.feed.sync.mutationKey(),
			status: "pending",
		},
		select: (m) => (m.state.variables as { id: string }).id,
	});
}
