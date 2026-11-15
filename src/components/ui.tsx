import Link from "next/link";
import type { Item, Level } from "@/lib/types";

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 ${className}`}>{children}</div>;
}

export function FreeBadge() {
  return <span className="rounded-full bg-green-700 px-2 py-0.5 text-xs font-bold uppercase text-white">Free</span>;
}

export function LevelBadge({ level }: { level: Level | null }) {
  if (!level) return null;
  return level === "co-ban" ? (
    <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-700">Cơ bản</span>
  ) : (
    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">Nâng cao</span>
  );
}

export function LockBadge() {
  return (
    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700" title="Cần đăng ký gói học">
      🔒 Gói học
    </span>
  );
}

const ICONS: Record<Item["type"], string> = { video: "▶", worksheet: "✎", document: "📄", test: "⏱" };

export function ItemIcon({ type }: { type: Item["type"] }) {
  const color =
    type === "video" ? "bg-brand-600" : type === "worksheet" ? "bg-accent-700" : type === "test" ? "bg-brand-800" : "bg-gray-600";
  return (
    <span aria-hidden className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white ${color}`}>
      {ICONS[type]}
    </span>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Đường dẫn" className="no-print text-sm text-gray-600">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>›</span>}
            {it.href ? (
              <Link href={it.href} className="inline-block py-2 text-brand-700 hover:underline">{it.label}</Link>
            ) : (
              <span aria-current="page" className="font-medium text-gray-800">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="bg-gradient-to-r from-brand-700 to-accent-700 text-white">
      <Container className="py-8 sm:py-10">
        {children}
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-white/95">{subtitle}</p>}
      </Container>
    </section>
  );
}

export function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <>
      <PageHero title={title} />
      <Container className="py-10">
        <div className="rounded-2xl border-2 border-dashed border-accent-200 bg-white p-6 text-center">
          <p className="text-lg font-semibold text-accent-700">Sắp ra mắt</p>
          <p className="mt-2 text-gray-700">{text}</p>
          <Link href="/hoc-thu" className="mt-4 inline-block rounded-full bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">
            Vào học thử
          </Link>
        </div>
      </Container>
    </>
  );
}
