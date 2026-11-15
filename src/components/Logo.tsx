import Link from "next/link";
import { site } from "@/data/site";

// Logo tạm vẽ bằng SVG theo tông cam – xanh. Khi có file logo thật (PNG/SVG), đặt vào public/logo.png
// và thay khối <svg> bằng <Image src="/logo.png" …/>.
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} – Trang chủ`}>
      <svg viewBox="0 0 48 48" className="h-11 w-11 shrink-0" aria-hidden>
        <circle cx="24" cy="24" r="23" fill="#fff7ed" stroke="#fed7aa" strokeWidth="2" />
        <circle cx="24" cy="12.5" r="5" fill="#1d4ed8" />
        <path d="M24 34 C19 27 14 24 9 24 L9 35 C14 35 19 37 24 40 Z" fill="#1d4ed8" />
        <path d="M24 34 C29 25 34 20 40 19 L40 33 C34 34 29 36 24 40 Z" fill="#f97316" />
        <path d="M24 34 V40" stroke="#fff" strokeWidth="1.5" />
      </svg>
      <span className="leading-none">
        <span className="block font-display text-lg font-extrabold text-brand-600 sm:text-xl">Học giỏi cùng</span>
        <span className="block font-display text-lg font-extrabold text-accent-600 sm:text-xl">cô Thanh Mai</span>
      </span>
    </Link>
  );
}
