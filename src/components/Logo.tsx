import Link from "next/link";
import { site } from "@/data/site";

// Logo tạm bằng chữ. Khi chủ dự án gửi logo, đặt file vào public/logo.png và thay phần ô tròn.
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-brand-700" aria-label={`${site.name} – Trang chủ`}>
      <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-accent-500 text-lg text-white">
        TM
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] sm:text-lg">Học giỏi cùng</span>
        <span className="block text-[15px] text-accent-700 sm:text-lg">cô Thanh Mai</span>
      </span>
    </Link>
  );
}
