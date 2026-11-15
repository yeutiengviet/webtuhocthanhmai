import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CurrentWeekButton, OpenWeekFromHash } from "@/components/CurrentWeekButton";
import { Breadcrumbs, Container, FreeBadge, ItemIcon, LevelBadge, LockBadge, PageHero } from "@/components/ui";
import { allCourses, canViewItem, getCourse, getSubject, gradeSlug, isReady, isTrack, itemHref, parseGradeSlug, publishedWeeks, TRACK_LABELS } from "@/lib/content";
import { formatRange } from "@/lib/dates";
import type { Week } from "@/lib/types";

export function generateStaticParams() {
  return allCourses().map((c) => ({ mon: c.subject, lop: gradeSlug(c.grade), track: c.track }));
}

type Params = Promise<{ mon: string; lop: string; track: string }>;

function load(mon: string, lop: string, track: string) {
  const subject = getSubject(mon);
  const grade = parseGradeSlug(lop);
  if (!subject || !grade || !isTrack(track)) return null;
  const course = getCourse(mon, grade, track);
  return course ? { subject, grade, course } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { mon, lop, track } = await params;
  const d = load(mon, lop, track);
  return { title: d ? `${d.subject.name} lớp ${d.grade} – ${TRACK_LABELS[d.course.track].name}` : "Không tìm thấy trang" };
}

const KIND_LABEL: Record<Week["kind"], string | null> = {
  hoc: null,
  "on-tap-giua-ky": "Ôn tập giữa kì",
  "on-tap-cuoi-ky": "Ôn tập cuối kì",
};

export default async function CoursePage({ params }: { params: Params }) {
  const { mon, lop, track } = await params;
  const d = load(mon, lop, track);
  if (!d) notFound();
  const { subject, grade, course } = d;
  const weeks = publishedWeeks(course);

  return (
    <>
      <PageHero title={`${subject.name} lớp ${grade} – ${TRACK_LABELS[course.track].name}`} subtitle={`${weeks.length} tuần · Sách Kết nối tri thức với cuộc sống · Lịch tuần là dự kiến.`}>
        <div className="mb-3 [&_a]:text-white [&_span]:text-white">
          <Breadcrumbs items={[{ href: `/${subject.slug}`, label: subject.name }, { href: `/${subject.slug}/${lop}`, label: `Lớp ${grade}` }, { label: TRACK_LABELS[course.track].name }]} />
        </div>
      </PageHero>

      <Container className="py-6">
        <OpenWeekFromHash />
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-accent-50 p-3 text-sm">
          <CurrentWeekButton weeks={weeks.map((w) => ({ number: w.number, startDate: w.startDate, endDate: w.endDate }))} />
          <span className="flex items-center gap-1"><FreeBadge /> học thử miễn phí</span>
          <span className="flex items-center gap-1"><LockBadge /> cần đăng ký gói</span>
        </div>

        <ol className="space-y-3">
          {weeks.map((w) => (
            <li key={w.id}>
              <details id={`tuan-${w.number}`} className="scroll-mt-28 rounded-2xl border border-gray-200 bg-white shadow-sm" open={w.number === 1}>
                <summary className="flex cursor-pointer items-start gap-3 p-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-600 text-center text-xs font-bold leading-tight text-white">
                    Tuần<br /><span className="text-lg">{w.number}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-gray-600">{formatRange(w.startDate, w.endDate)}</span>
                    <span className="block font-semibold text-gray-900">{w.title}</span>
                    {KIND_LABEL[w.kind] && (
                      <span className="mt-1 inline-block rounded-full bg-accent-700 px-2 py-0.5 text-xs font-bold text-white">{KIND_LABEL[w.kind]}</span>
                    )}
                  </span>
                  <span aria-hidden className="chevron mt-3 text-gray-500 transition-transform">▼</span>
                </summary>
                <ul className="divide-y divide-gray-100 border-t border-gray-100">
                  {w.items.map((it) => {
                    const scored = it.type === "worksheet" || it.type === "test";
                    return (
                      <li key={it.id}>
                        <Link href={itemHref(course, w, it)} className="flex items-start gap-3 px-4 py-3 hover:bg-brand-50">
                          <ItemIcon type={it.type} />
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium text-gray-900">{it.title}</span>
                            <span className="mt-1 flex flex-wrap items-center gap-1.5">
                              {it.isFree ? <FreeBadge /> : <LockBadge />}
                              <LevelBadge level={it.level} />
                              {it.isExtension && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">Mở rộng</span>}
                              {it.durationMinutes && <span className="text-xs text-gray-600">{it.durationMinutes} phút</span>}
                              {!isReady(it) && <span className="text-xs text-gray-500">· đang cập nhật</span>}
                            </span>
                            {scored && (
                              <span className="mt-1 block text-xs text-gray-600">
                                {/* Giai đoạn 4 sẽ lấy từ bảng attempts theo học sinh đăng nhập */}
                                Điểm cao nhất · Số lần làm: hiện khi con đăng nhập
                              </span>
                            )}
                          </span>
                          <span className="sr-only">{canViewItem(it) ? "Xem được" : "Cần đăng ký gói"}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          ))}
        </ol>
      </Container>
    </>
  );
}
