import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Kết nối Supabase KHÔNG mang phiên đăng nhập — dùng cho trang công khai (danh sách đề).
 * Chỉ đọc được những gì Row Level Security cho phép người lạ đọc. Cho phép Vercel lưu sẵn trang (nhanh hơn).
 */
export function createSupabasePublic() {
  const env = supabaseEnv();
  if (!env) throw new Error("Chưa cấu hình Supabase");
  return createClient(env.url, env.key, { auth: { persistSession: false, autoRefreshToken: false } });
}
