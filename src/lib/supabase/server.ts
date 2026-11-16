import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "@/lib/supabase/env";

/** Kết nối Supabase phía máy chủ, mang theo phiên đăng nhập (cookie) của người đang xem. */
export async function createSupabaseServer() {
  const env = supabaseEnv();
  if (!env) throw new Error("Chưa cấu hình Supabase (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  const store = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Gọi từ Server Component (không ghi được cookie) — proxy.ts sẽ làm mới phiên.
        }
      },
    },
  });
}

/** Người đang đăng nhập có phải quản trị không (kiểm tra ở máy chủ, đọc bảng profiles qua RLS). */
export async function getAdmin() {
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { supabase, user: null, isAdmin: false } as const;
  const { data } = await supabase.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
  return { supabase, user: auth.user, isAdmin: data?.role === "admin" } as const;
}

/**
 * Người đang xem có đăng nhập không (bất kỳ tài khoản nào — phụ huynh hoặc quản trị).
 * Chưa cấu hình Supabase hoặc lỗi mạng → coi như khách (không đăng nhập).
 * LƯU Ý: gọi hàm này làm trang thành trang động (đọc cookie) — không bị lưu đệm chung giữa người xem.
 */
export async function getViewer() {
  try {
    const supabase = await createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}
