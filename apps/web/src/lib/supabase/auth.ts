import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./client";

/**
 * Đọc session từ storage. KHÔNG gọi network trừ khi access token đã hết hạn
 * (lúc đó supabase-js tự refresh). Dùng hàm này thay cho getUser() ở mọi
 * đường đi offline-first — getUser() luôn gọi API nên sẽ fail khi mất mạng.
 */
export async function getSession(): Promise<Session | null> {
	const {
		data: { session },
		error,
	} = await supabase.auth.getSession();

	if (error) throw error;
	return session;
}

/** User hiện tại, đọc từ session local. Trả null nếu chưa đăng nhập. */
export async function getCurrentUser(): Promise<User | null> {
	const session = await getSession();
	return session?.user ?? null;
}

/** ID user hiện tại. Ném lỗi nếu chưa có session. Không gọi network. */
export async function getOwnerId(): Promise<string> {
	const user = await getCurrentUser();
	if (!user) throw new Error("Chưa đăng nhập");
	return user.id;
}

/**
 * Đảm bảo có session. Nếu chưa có thì đăng nhập ẩn danh.
 * Chỉ nhánh signInAnonymously() mới cần mạng.
 */
export async function ensureSession(): Promise<Session> {
	const existing = await getSession();
	if (existing) return existing;

	const { data, error } = await supabase.auth.signInAnonymously();
	if (error) throw error;
	if (!data.session) {
		throw new Error("signInAnonymously không trả về session");
	}
	return data.session;
}

export async function signOut(): Promise<void> {
	const { error } = await supabase.auth.signOut();
	if (error) throw error;
}
