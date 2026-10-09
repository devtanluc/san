import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { queryClient, trpcClient } from "@/utils/trpc";

export type Todo = {
	id: string;
	text: string;
	completed: boolean;
	createdAt: string;
};

export const todoCollection = createCollection(
	queryCollectionOptions<Todo>({
		id: "todos",
		queryKey: ["todos"],
		queryClient,
		getKey: (todo) => todo.id,

		// Kết quả queryFn được coi là TOÀN BỘ trạng thái của collection.
		// Trả về [] đồng nghĩa với xóa hết, nên để lỗi được throw thay vì nuốt lỗi rồi trả [].
		queryFn: () => trpcClient.todo.getAll.query(),

		onInsert: async ({ transaction }) => {
			await Promise.all(
				transaction.mutations.map((m) =>
					trpcClient.todo.create.mutate({
						id: m.modified.id,
						text: m.modified.text,
					}),
				),
			);
			// Trước v1.0 collection tự refetch sau handler (đồng bộ createdAt từ server).
			// Từ v1.0 phải gọi: await collection.utils.refetch()
		},

		onUpdate: async ({ transaction }) => {
			await Promise.all(
				transaction.mutations.map((m) =>
					// m.changes chỉ chứa các field đã đổi (completed và/hoặc text)
					trpcClient.todo.update.mutate({
						id: String(m.key),
						text: m.changes.text,
						completed: m.changes.completed,
					}),
				),
			);
		},

		onDelete: async ({ transaction }) => {
			await Promise.all(
				transaction.mutations.map((m) =>
					trpcClient.todo.delete.mutate({ id: String(m.key) }),
				),
			);
		},
	}),
);
