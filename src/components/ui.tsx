import Link from "next/link";
import { Icon } from "@/components/art";
import type { Item, Level } from "@/lib/types";

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 ${className}`}>{children}</div>;
}

/** Màu riêng cho từng lớp — giúp trẻ nhận ra lớp của mình. Chữ trắng trên các nền này đều ≥ 4.5:1. */
export const GRADE_THEME: Record<number, { bg: string; soft: string; text: string; ring: string; emoji: string }> = {
  2: { bg: "bg-emerald-700", soft: "bg-emerald-50", text: "text-emerald-800", ring: "ring-emerald-200", emoji: "🌱" },
  3: { bg: "bg-sky-700", soft: "bg-sky-50", text: "text-sky-800", ring: "ring-sky-200", emoji: "🚀" },
  4: { bg: "bg-brand-600", soft: "bg-brand-50", text: "text-brand-700", ring: "ring-brand-200", emoji: "⭐" },
  5: { bg: "bg-violet-700", soft: "bg-violet-50", text: "text-violet-800", ring: "ring-violet-200", emoji: "🏆" },
};

export function FreeBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide text-white">
      <Icon name="gift" className="h-3.5 w-3.5" /> Free
    </span>
  );
}

export function LevelBadge({ level }: { level: Level | null }) {
  if (!level) return null;
  return level === "co-ban" ? (
    <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-bold text-accent-700">Cơ bản</span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-800">
      <Icon name="star" className="h-3 w-3" /> Nâng cao
    </span>
  );
}

export function LockBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-bold text-gray-700" title="Đăng nhập (tài khoản miễn phí) để học">
      <Icon name="lock" className="h-3.5 w-3.5" /> Đăng nhập
    </span>
  );
}

const ITEM_ICON: Record<Item["type"], { icon: "play" | "pencil" | "doc" | "timer"; color: string }> = {
  video: { icon: "play", color: "bg-brand-600" },
  worksheet: { icon: "pencil", color: "bg-accent-600" },
  test: { icon: "timer", color: "bg-violet-700" },
  document: { icon: "doc", color: "bg-gray-600" },
};

export function ItemIcon({ type, size = "md" }: { type: Item["type"]; size?: "md" | "lg" }) {
  const { icon, color } = ITEM_ICON[type];
  const box = size === "lg" ? "h-12 w-12 rounded-2xl" : "h-10 w-10 rounded-xl";
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center text-white shadow-sm ${box} ${color}`}>
      <Icon name={icon} className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
    </span>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Đường dẫn" className="no-print text-sm font-semibold text-gray-600">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden className="text-brand-300">›</span>}
            {it.href ? (
              <Link href={it.href} className="inline-block rounded-full px-1 py-2 text-brand-700 hover:underline">{it.label}</Link>
            ) : (
              <span aria-current="page" className="text-gray-800">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Đầu trang con: nền cam nhạt có hình trang trí, chữ đậm màu tối — dễ đọc trên điện thoại. */
export function PageHero({ title, subtitle, children, badge }: { title: string; subtitle?: string; children?: React.ReactNode; badge?: string }) {
  return (
    <section className="relative overflow-hidden border-b-4 border-brand-200 bg-gradient-to-br from-brand-100 via-brand-50 to-accent-50">
      <span aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-300/40" />
      <span aria-hidden className="absolute -bottom-12 right-24 h-28 w-28 rounded-full bg-accent-200/60" />
      <span aria-hidden className="absolute right-6 top-6 text-3xl animate-float">⭐</span>
      <Container className="relative py-7 sm:py-10">
        {children}
        {badge && <p className="mb-2 inline-block rounded-full bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-brand-700 shadow-sm">{badge}</p>}
        <h1 className="text-3xl text-gray-900 sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-gray-700">{subtitle}</p>}
      </Container>
    </section>
  );
}

export function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <>
      <PageHero title={title} badge="Sắp ra mắt" />
      <Container className="py-10">
        <div className="mx-auto max-w-xl rounded-[2rem] border-2 border-dashed border-brand-200 bg-white p-8 text-center shadow-sm">
          <p className="text-5xl" aria-hidden>🚧</p>
          <p className="mt-3 font-display text-2xl text-brand-700">Cô Thanh Mai đang chuẩn bị</p>
          <p className="mt-2 text-gray-700">{text}</p>
          <Link href="/toan" className="btn-toy mt-5 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-extrabold text-white">
            Vào học Toán <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </>
  );
}
