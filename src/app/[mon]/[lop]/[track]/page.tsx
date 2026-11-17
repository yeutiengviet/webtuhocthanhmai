import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CurrentWeekButton, OpenWeekFromHash } from "@/components/CurrentWeekButton";
import { Breadcrumbs, Container, FreeBadge, ItemIcon, LevelBadge, LockBadge, PageHero } from "@/components/ui";
import { allCourses, canViewItem, getCourse, getSubject, gradeSlug, isReady, isTrack, itemHref, parseGradeSlug, publishedWeeks, TRACK_LABELS, unitName, weekSlug } from "@/lib/content";
import { formatRange } from "@/lib/dates";
import { getPublishedLessonFiles } from "@/lib/lesson-files";
import { lessonFileHref } from "@/lib/exam-meta";
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


  if (course.track === "on-tap-he") {
    const items = weeks.flatMap((w) => w.items.map((it) => ({ w, it })));
    const readyCount = items.filter(({ it }) => {
      const f = files.get(it.id);
      return Boolean(f && (f.hasHtml || f.hasPdf));
    }).length;
    const other = subject.slug === "toan" ? { slug: "tieng-viet", name: "Tiếng Việt" } : { slug: "toan", name: "Toán" };
    return (
      <>
        <PageHero badge="☀️ Ôn tập hè" title={`Đề ôn tập hè ${subject.name} lớp ${grade}`} subtitle={`${items.length} đề: ${weeks.map((w) => `${w.items.length} ${w.label?.toLowerCase()}`).join(" và ")}. Mỗi đề có bài làm tương tác trên web và phiếu PDF tải về in.`}>
          <div className="mb-2">
            <Breadcrumbs items={[{ href: `/${subject.slug}`, label: subject.name }, { href: `/${subject.slug}/${lop}`, label: `Lớp ${grade}` }, { label: TRACK_LABELS[course.track].name }]} />
          </div>
        </PageHero>
        <Container className="py-6">
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
              <h2 className="text-lg font-extrabold text-gray-900">Cách ôn hè hiệu quả</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-gray-800">
                <li><span aria-hidden>✏️</span> <strong>Làm trên web:</strong> con làm bài, nộp là có điểm ngay.</li>
                <li><span aria-hidden>⬇️</span> <strong>Tải PDF:</strong> phụ huynh in ra cho con làm trên giấy.</li>
                <li><span aria-hidden>📅</span> Mỗi tuần 2–3 đề: làm đề cơ bản trước, vững rồi chuyển sang đề nâng cao.</li>
              </ul>
            </div>
            <div className="rounded-3xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <p className="font-extrabold text-amber-900">Đã có {readyCount} / {items.length} đề</p>
              <p className="mt-1 text-sm text-amber-900">Cô đang cập nhật dần các đề còn lại.</p>
              <Link href={`/${other.slug}/${lop}/on-tap-he`} className="mt-3 inline-flex min-h-11 items-center rounded-full bg-white px-4 font-extrabold text-amber-900 ring-1 ring-amber-300">
                ☀️ Ôn hè {other.name} lớp {grade} →
              </Link>
            </div>
          </div>
          <nav aria-label="Chọn phần" className="mb-5 flex flex-wrap gap-2">
            {weeks.map((w) => (
              <a key={w.id} href={`#${w.slug}`} className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 font-extrabold ring-2 ${w.items[0]?.level === "nang-cao" ? "bg-brand-50 text-brand-800 ring-brand-200" : "bg-accent-50 text-accent-800 ring-accent-200"}`}>
                <span aria-hidden>{w.items[0]?.level === "nang-cao" ? "⭐" : "📗"}</span> {w.label} ({w.items.length} đề)
              </a>
            ))}
          </nav>
          {weeks.map((w) => {
            const advanced = w.items[0]?.level === "nang-cao";
            return (
              <section key={w.id} id={w.slug} aria-labelledby={`${w.slug}-title`} className="mb-8 scroll-mt-32">
                <h2 id={`${w.slug}-title`} className="flex items-center gap-2 font-display text-2xl font-extrabold text-gray-900">
                  <span aria-hidden>{advanced ? "⭐" : "📗"}</span> {w.label}
                </h2>
                <p className="mb-3 text-sm text-gray-700">{advanced ? "Dành cho con đã vững kiến thức cơ bản, muốn thử sức với bài khó hơn." : "Củng cố kiến thức trọng tâm của cả năm — con nên làm phần này trước."}</p>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {w.items.map((it) => {
                    const f = files.get(it.id);
                    const hasHtml = Boolean(f?.hasHtml);
                    const hasPdf = Boolean(f?.hasPdf);
                    return (
                      <li key={it.id} className={`flex flex-col rounded-3xl bg-white p-4 shadow-sm ring-1 ${advanced ? "ring-brand-200" : "ring-amber-200"}`}>
                        <p className="flex items-center gap-2">
                          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-xl font-extrabold text-white ${advanced ? "bg-brand-600" : "bg-amber-500"}`}>{it.order}</span>
                          <span className="min-w-0">
                            <span className="block font-display text-lg font-extrabold text-gray-900">Đề {it.order}</span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-gray-600">{subject.name} lớp {grade} <LevelBadge level={it.level} /></span>
                          </span>
                        </p>
                        <div className="mt-3 flex flex-1 flex-wrap items-end gap-2">
                          {hasHtml && (
                            <Link href={itemHref(course, w, it)} className="btn-toy inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brand-600 px-4 font-extrabold text-white">
                              <span aria-hidden>✏️</span> Làm trên web
                            </Link>
                          )}
                          {hasPdf && (
                            <a href={lessonFileHref(it.id, "pdf")} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 font-extrabold text-brand-700 ring-2 ring-brand-200">
                              <span aria-hidden>⬇️</span> Tải PDF
                            </a>
                          )}
                          {!hasHtml && !hasPdf && <span className="text-sm font-semibold text-gray-500">Đang cập nhật</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
          <p className="mt-6 text-sm text-gray-600">
            <Link href={`/${subject.slug}/${lop}`} className="font-bold text-brand-700 underline">← Các mục khác của {subject.name} lớp {grade}</Link>
          </p>
        </Container>
      </>
    );
  }

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
                  Các chuyên đề nâng cao toán lớp {grade}: từng dạng toán tư duy. Mỗi bài giảng là một video có hướng dẫn giải; học xong con làm thêm bài luyện tập để nhớ lâu.
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold"><FreeBadge /> ai cũng xem được <LockBadge /> đăng nhập (tài khoản miễn phí) để học</p>
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
                            <span className="sr-only">{open ? "Xem được" : "Cần đăng nhập"}</span>
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
          <p className="mt-2 text-sm text-gray-700">Mỗi tuần gồm: bài giảng theo sách giáo khoa, đề luyện tập cơ bản và nâng cao.</p>
        </div>
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-3xl bg-white p-3 text-sm font-semibold shadow-sm ring-1 ring-brand-100">
          {!isTopics && <CurrentWeekButton weeks={weeks.filter((w) => w.kind === "hoc").map((w) => ({ number: w.number, startDate: w.startDate, endDate: w.endDate }))} />}
          <span className="flex items-center gap-1"><FreeBadge /> ai cũng xem được</span>
          <span className="flex items-center gap-1"><LockBadge /> đăng nhập (tài khoản miễn phí) để học</span>
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
                          <span className="sr-only">{open ? "Xem được" : "Cần đăng nhập"}</span>
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
