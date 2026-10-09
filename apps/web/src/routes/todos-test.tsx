import { Button } from "@san/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@san/ui/components/card";
import { Checkbox } from "@san/ui/components/checkbox";
import { Input } from "@san/ui/components/input";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";

import { todoCollection } from "@/collections/todo";

export const Route = createFileRoute("/todos-test")({
	component: TodosRoute,
});

function TodosRoute() {
	const [newTodoText, setNewTodoText] = useState("");

	// Live query: tự cập nhật khi collection đổi (kể cả thay đổi optimistic)
	const { data: todos, isLoading } = useLiveQuery((q) =>
		q
			.from({ todo: todoCollection })
			.orderBy(({ todo }) => todo.createdAt, "asc"),
	);

	const handleAddTodo = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const text = newTodoText.trim();
		if (!text) return;

		// UI cập nhật ngay, tRPC chạy nền trong onInsert; lỗi thì tự rollback
		todoCollection.insert({
			id: crypto.randomUUID(),
			text,
			completed: false,
			createdAt: new Date().toISOString(),
		});
		setNewTodoText("");
	};

	const handleToggleTodo = (id: string) => {
		todoCollection.update(id, (draft) => {
			draft.completed = !draft.completed;
		});
	};

	const handleDeleteTodo = (id: string) => {
		todoCollection.delete(id);
	};

	return (
		<div className="mx-auto w-full max-w-md py-10">
			<Card>
				<CardHeader>
					<CardTitle>Todo List</CardTitle>
					<CardDescription>Manage your tasks efficiently</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleAddTodo}
						className="mb-6 flex items-center space-x-2"
					>
						<Input
							value={newTodoText}
							onChange={(e) => setNewTodoText(e.target.value)}
							placeholder="Add a new task..."
						/>
						<Button type="submit" disabled={!newTodoText.trim()}>
							Add
						</Button>
					</form>

					{isLoading ? (
						<div className="flex justify-center py-4">
							<Loader2 className="h-6 w-6 animate-spin" />
						</div>
					) : todos.length === 0 ? (
						<p className="py-4 text-center">No todos yet. Add one above!</p>
					) : (
						<ul className="space-y-2">
							{todos.map((todo) => (
								<li
									key={todo.id}
									className="flex items-center justify-between rounded-md border p-2"
								>
									<div className="flex items-center space-x-2">
										<Checkbox
											checked={todo.completed}
											onCheckedChange={() => handleToggleTodo(todo.id)}
											id={`todo-${todo.id}`}
										/>
										<label
											htmlFor={`todo-${todo.id}`}
											className={todo.completed ? "line-through" : ""}
										>
											{todo.text}
										</label>
									</div>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleDeleteTodo(todo.id)}
										aria-label="Delete todo"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
