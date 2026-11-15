// Đọc cấu hình Supabase. Chỉ là khóa CÔNG KHAI; quyền hạn do Row Level Security trong cơ sở dữ liệu quyết định.
export function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export const STORAGE_BUCKET = "phieu";
