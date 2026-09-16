import { createClient, type Session } from "@supabase/supabase-js";
import { ENV } from "@/env";

export const supabase = createClient(
	ENV.VITE_SUPABASE_URL,
	ENV.VITE_SUPABASE_PUBLISHABLE_KEY,
	{
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: true,
		},
	},
);

/**
 * Đăng nhập ẩn danh nếu chưa có user. Nếu đã có session thì bỏ qua.
 */
export async function signInAnonymously() {
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (user?.id) return;

	const {
		data: { session },
		error,
	} = await supabase.auth.signInAnonymously();

	if (error) throw error;
	return session;
}

export async function signOut() {
	const { error } = await supabase.auth.signOut();
	if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
	const {
		data: { session },
		error,
	} = await supabase.auth.getSession();

	if (error) throw error;
	return session;
}

export async function getOwnerId() {
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) throw new Error("Chưa đăng nhập");
	return user.id;
}
