import Link from "next/link";
import { Container, GRADE_THEME, ItemIcon, LevelBadge, PageHero } from "@/components/ui";
import { freeItems, getSubject, isReady, itemHref } from "@/lib/content";
import type { Course, Item, Week } from "@/lib/types";

export const metadata = { title: "Học thử" };

export default function TrialPage() {
  // Gom các bài Free theo từng khóa (môn + lớp)
  const groups = new Map<string, { course: Course; rows: { week: Week; item: Item }[] }>();
  for (const { course, week, item } of freeItems()) {
    const g = groups.get(course.id) ?? { course, rows: [] };
    g.rows.push({ week, item });
    groups.set(course.id, g);
  }

  return (
    <>
      <PageHero badge="🎁 Miễn phí" title="Học thử miễn phí" subtitle="Các bài có nhãn Free — không cần đăng nhập, không cần đăng ký gói. Chọn môn và lớp của con bên dưới." />
      <Container className="space-y-4 py-8">
        {[...groups.values()].map(({ course, rows }) => {
          const t = GRADE_THEME[course.grade];
          const ready = rows.filter((r) => isReady(r.item)).length;
          return (
            <details key={course.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-100 open:ring-2 open:ring-brand-300" open={course.id === "toan-4-theo-tuan"}>
              <summary className="flex cursor-pointer items-center gap-3 p-4">
                <span aria-hidden className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl ${t.soft}`}>{t.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-extrabold text-gray-900">
                    {getSubject(course.subject)?.name} lớp {course.grade}
                  </span>
                  <span className="block text-sm font-semibold text-gray-600">
                    {rows.length} bài học thử · {ready > 0 ? `${ready} bài đã có nội dung` : "đang cập nhật nội dung"}
                  </span>
                </span>
                <span aria-hidden className="chevron grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 transition-transform">▾</span>
              </summary>
              <ul className="grid gap-2 border-t-2 border-dashed border-brand-100 bg-brand-50/40 p-3 sm:grid-cols-2">
                {rows.map(({ week, item }) => (
                  <li key={item.id}>
                    <Link href={itemHref(course, week, item)} className="card-lift flex h-full items-start gap-3 rounded-2xl bg-white p-3 ring-1 ring-gray-100">
                      <ItemIcon type={item.type} />
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-brand-700">Tuần {week.number}</span>
                        <span className="block font-bold leading-snug text-gray-900">{item.title}</span>
                        <span className="mt-1 flex items-center gap-2">
                          <LevelBadge level={item.level} />
                          {!isReady(item) && <span className="text-xs text-gray-600">đang cập nhật</span>}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </Container>
    </>
  );
}
