import type { Metadata } from "next";

// Khu quản trị: không cho công cụ tìm kiếm lập chỉ mục; luôn render động (kiểm tra quyền mỗi lần mở).
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[60vh]">{children}</div>;
}
