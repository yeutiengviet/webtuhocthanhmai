import "server-only";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/supabase/server";

/** Dùng ở đầu mọi trang/thao tác quản trị: chưa đăng nhập → về trang đăng nhập; không phải quản trị → báo không có quyền. */
export async function requireAdminPage() {
  const ctx = await getAdmin();
  if (!ctx.user) redirect("/quan-tri/dang-nhap");
  return ctx;
}
