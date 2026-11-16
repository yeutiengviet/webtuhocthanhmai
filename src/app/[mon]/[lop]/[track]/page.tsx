import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CurrentWeekButton, OpenWeekFromHash } from "@/components/CurrentWeekButton";
import { Breadcrumbs, Container, FreeBadge, ItemIcon, LevelBadge, LockBadge, PageHero } from "@/components/ui";
import { allCourses, canViewItem, getCourse, getSubject, gradeSlug, isReady, isTrack, itemHref, parseGradeSlug, publishedWeeks, TRACK_LABELS, unitName, weekSlug } from "@/lib/content";
import { formatRange } from "@/lib/dates";
import { getPublishedLessonFiles } from "@/lib/lesson-files";
import type { Week } from "@/lib/types";

// Tự làm mới mỗi 60 giây (cô tải phiếu lên thì làm mới ngay) để hiện đúng mục đã có phiếu.
export const revalidate = 60;

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
  const files = await getPublishedLessonFiles(publishedWeeks(course).flatMap((w) => w.items.map((i) => i.id)));
  const weeks = publishedWeeks(course);
  const unit = unitName(course);
  const teachingCount = weeks.filter((w) => w.kind === "hoc").length;
  const isTopics = course.track === "nang-cao";
  const totalLessons = weeks.reduce((a, w) => a + w.items.length, 0);


  if (isTopics) {
    return (
      <>
        <PageHero badge={`🧠 ${teachingCount} chuyên đề`} title={`Toán nâng cao – Toán tư duy lớp ${grade}`} subtitle={`${teachingCount} chuyên đề · ${totalLessons} bài giảng. Học theo thứ tự hoặc chọn chuyên đề con cần luyện thêm.`}>
          <div className="mb-2">
            <Breadcrumbs items={[{ href: `/${subject.slug}`, label: subject.name }, { href: `/${subject.slug}/${lop}`, label: `Lớp ${grade}` }, { label: TRACK_LABELS[course.track].name }]} />
          </div>
        </PageHero>
        <Container className="py-6">
          <OpenWeekFromHash />
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <nav aria-label="Các chuyên đề" className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-accent-200">
                <h2 className="text-lg font-extrabold uppercase tracking-wide text-gray-900">Cùng khóa học</h2>
                <ol className="mt-2 divide-y divide-gray-100">
                  {weeks.map((w) => (
                    <li key={w.id}>
                      <a href={`#${weekSlug(w)}`} className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm font-extrabold uppercase text-accent-700 hover:text-accent-800">
                        <span>{w.title}</span>
                        <span className="shrink-0 rounded-full bg-accent-50 px-2 py-0.5 text-xs font-bold text-accent-700 ring-1 ring-accent-200">{w.items.length}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
            <div className="min-w-0 space-y-5">
              <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
                <h2 className="text-2xl font-extrabold uppercase text-brand-800">Toán nâng cao – Toán tư duy lớp {grade}</h2>
                <p className="mt-2 text-gray-700">
                  Các chuyên đề nâng cao toán lớp {grade}: từ bài giảng học thử đến từng dạng toán tư duy. Mỗi bài giảng là một video có hướng dẫn giải; học xong con làm thêm bài luyện tập để nhớ lâu.
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold"><FreeBadge /> học thử miễn phí <LockBadge /> cần đăng ký gói</p>
              </section>
              {weeks.map((w, idx) => (
                <details key={w.id} id={weekSlug(w)} className="scroll-mt-28 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-100 open:ring-2 open:ring-brand-300" open={idx === 0}>
                  <summary className="flex cursor-pointer items-center gap-3 p-4">
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-extrabold uppercase text-accent-700">{w.title}</span>
                      <span className="text-sm font-semibold text-gray-600">{w.items.length} bài giảng · Luyện tập chuyên đề</span>
                    </span>
                    <span aria-hidden className="chevron grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 transition-transform">▾</span>
                  </summary>
                  <ul className="space-y-2 border-t-2 border-dashed border-brand-100 bg-brand-50/40 p-3">
                    {w.items.map((it) => {
                      const f = files.get(it.id);
                      const open = canViewItem(it) || Boolean(f?.isFree);
                      const ready = isReady(it) || Boolean(f && (f.hasHtml || f.hasPdf));
                      return (
                        <li key={it.id}>
                          <Link href={itemHref(course, w, it)} className="card-lift flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-gray-100">
                            <ItemIcon type={it.type} />
                            <span className="min-w-0 flex-1">
                              <span className="block font-bold leading-snug text-gray-900">{it.title}</span>
                              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                                {open ? <FreeBadge /> : <LockBadge />}
                                <LevelBadge level={it.level} />
                                {!ready && <span className="text-xs text-gray-500">· đang cập nhật</span>}
                              </span>
                            </span>
                            <span className="sr-only">{open ? "Xem được" : "Cần đăng ký gói"}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <PageHero badge={`📚 ${teachingCount} ${unit.toLowerCase()}`} title={`${subject.name} lớp ${grade} – ${TRACK_LABELS[course.track].name}`} subtitle={isTopics ? `${teachingCount} chuyên đề · ${totalLessons} bài giảng · Toán tư duy nâng cao, học theo thứ tự hoặc chọn chuyên đề con cần.` : `${teachingCount} tuần · Sách Kết nối tri thức với cuộc sống · Lịch tuần là dự kiến.`}>
        <div className="mb-2">
          <Breadcrumbs items={[{ href: `/${subject.slug}`, label: subject.name }, { href: `/${subject.slug}/${lop}`, label: `Lớp ${grade}` }, { label: TRACK_LABELS[course.track].name }]} />
        </div>
      </PageHero>

      <Container className="py-6">
        <OpenWeekFromHash />
        {course.isSkeleton && !isTopics && (
          <p className="mb-5 rounded-3xl bg-amber-50 p-4 text-sm font-semibold text-amber-900 ring-1 ring-amber-200">
            <span aria-hidden>🛠️</span> Khóa học này mới có <strong>khung 35 tuần</strong>. Cô Thanh Mai đang cập nhật tên bài, video và phiếu luyện tập.
          </p>
        )}
        <div className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
          <h2 className="text-lg font-extrabold text-gray-900">Lộ trình học tốt toán trên lớp</h2>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm font-extrabold">
            {[["Tuần 1–9", "tuan-1"], ["Tuần 10–18", "tuan-10"], ["Tuần 18–27", "tuan-18"], [`Tuần 27–${teachingCount}`, "tuan-27"]].map(([label, id]) => (
              <li key={id}><a href={`#${id}`} className="inline-flex min-h-11 items-center rounded-full bg-brand-50 px-4 text-brand-800 ring-1 ring-brand-200 hover:bg-brand-100">{label}</a></li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-gray-700">Mỗi tuần gồm: bài giảng theo sách giáo khoa, đề luyện tập cơ bản và nâng cao, bài giảng toán tư duy.</p>
        </div>
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-3xl bg-white p-3 text-sm font-semibold shadow-sm ring-1 ring-brand-100">
          {!isTopics && <CurrentWeekButton weeks={weeks.filter((w) => w.kind === "hoc").map((w) => ({ number: w.number, startDate: w.startDate, endDate: w.endDate }))} />}
          <span className="flex items-center gap-1"><FreeBadge /> học thử miễn phí</span>
          <span className="flex items-center gap-1"><LockBadge /> cần đăng ký gói</span>
        </div>

        <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-[2.1rem] before:top-4 before:w-1 before:rounded-full before:bg-brand-200">
          {weeks.map((w) => (
            <li key={w.id}>
              <details id={weekSlug(w)} className="relative scroll-mt-28 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-brand-100 open:shadow-md open:ring-2 open:ring-brand-300" open={w.number === 1}>
                <summary className="flex cursor-pointer items-start gap-3 p-4">
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-center text-[11px] font-extrabold leading-none text-white shadow ${w.kind === "hoc" ? "bg-brand-600" : "bg-violet-700"}`}>
                    <span>{w.label ? "ÔN" : isTopics ? "CHUYÊN ĐỀ" : "TUẦN"}<span className="block font-display text-2xl leading-none">{w.label ? "TẬP" : w.number}</span></span>
                  </span>
                  <span className="min-w-0 flex-1">
                    {isTopics || w.kind !== "hoc" ? null : <span className="block text-sm font-bold text-brand-700">{formatRange(w.startDate, w.endDate)}</span>}
                    <span className="block font-bold leading-snug text-gray-900">{w.title}</span>
                    {KIND_LABEL[w.kind] && (
                      <span className="mt-1.5 inline-block rounded-full bg-violet-700 px-2.5 py-0.5 text-xs font-extrabold text-white"><span aria-hidden>📝</span> {KIND_LABEL[w.kind]}</span>
                    )}
                  </span>
                  <span aria-hidden className="chevron mt-3 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 transition-transform">▾</span>
                </summary>
                <ul className="grid gap-2 border-t-2 border-dashed border-brand-100 bg-brand-50/40 p-3 sm:grid-cols-2">
                  {w.items.map((it) => {
                    const scored = it.type === "worksheet" || it.type === "test";
                    const f = files.get(it.id);
                    const open = canViewItem(it) || Boolean(f?.isFree);
                    const ready = isReady(it) || Boolean(f && (f.hasHtml || f.hasPdf));
                    return (
                      <li key={it.id}>
                        <Link href={itemHref(course, w, it)} className="card-lift flex h-full items-start gap-3 rounded-2xl bg-white p-3 ring-1 ring-gray-100">
                          <ItemIcon type={it.type} />
                          <span className="min-w-0 flex-1">
                            <span className="block font-bold leading-snug text-gray-900">{it.title}</span>
                            <span className="mt-1 flex flex-wrap items-center gap-1.5">
                              {open ? <FreeBadge /> : <LockBadge />}
                              <LevelBadge level={it.level} />
                              {it.isExtension && <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-800"><span aria-hidden>💡</span> Mở rộng</span>}
                              {it.durationMinutes && <span className="text-xs text-gray-600">{it.durationMinutes} phút</span>}
                              {!ready && <span className="text-xs text-gray-500">· đang cập nhật</span>}
                            </span>
                            {scored && (
                              <span className="mt-1.5 block rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
                                {/* Giai đoạn 4 sẽ lấy từ bảng attempts theo học sinh đăng nhập */}
                                🏆 Điểm cao nhất · Số lần làm: hiện khi con đăng nhập
                              </span>
                            )}
                          </span>
                          <span className="sr-only">{open ? "Xem được" : "Cần đăng ký gói"}</span>
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
