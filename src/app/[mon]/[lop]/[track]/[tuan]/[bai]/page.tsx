import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoEmbed, WorksheetFrame } from "@/components/LessonMedia";
import { PrintButton } from "@/components/PrintButton";
import { Breadcrumbs, Container, FreeBadge, ItemIcon, LevelBadge, LockBadge } from "@/components/ui";
import {
  allCourses,
  canViewItem,
  courseHref,
  findItem,
  findWeek,
  getCourse,
  getSubject,
  gradeSlug,
  ITEM_TYPE_LABELS,
  itemHref,
  parseGradeSlug,
  publishedWeeks,
  safeWorksheetUrl,
  TRACK_LABELS,
  weekSlug,
} from "@/lib/content";
import { formatRange } from "@/lib/dates";
import type { Item, Track } from "@/lib/types";

export function generateStaticParams() {
  return allCourses().flatMap((c) =>
    publishedWeeks(c).flatMap((w) =>
      w.items.map((it) => ({ mon: c.subject, lop: gradeSlug(c.grade), track: c.track, tuan: weekSlug(w), bai: it.slug })),
    ),
  );
}

type Params = Promise<{ mon: string; lop: string; track: string; tuan: string; bai: string }>;

function load(p: Awaited<Params>) {
  const subject = getSubject(p.mon);
  const grade = parseGradeSlug(p.lop);
  if (!subject || !grade || !(p.track in TRACK_LABELS)) return null;
  const course = getCourse(p.mon, grade, p.track as Track);
  const week = course && findWeek(course, p.tuan);
  const item = week && findItem(week, p.bai);
  return course && week && item ? { subject, grade, course, week, item } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const d = load(await params);
  return { title: d ? `${d.item.title} – Tuần ${d.week.number}` : undefined };
}

export default async function LessonPage({ params }: { params: Params }) {
  const d = load(await params);
  if (!d) notFound();
  const { subject, grade, course, week, item } = d;
  const allowed = canViewItem(item);

  // Phiếu luyện tập gắn với bài giảng video: phiếu cơ bản của tuần
  const practice: Item | undefined =
    item.type === "video" ? week.items.find((i) => i.type === "worksheet") : undefined;

  const weeks = publishedWeeks(course);
  const idx = weeks.findIndex((w) => w.id === week.id);
  const nearby = weeks.slice(Math.max(0, idx - 2), idx + 3).filter((w) => w.id !== week.id);

  return (
    <Container className="py-5">
      <Breadcrumbs
        items={[
          { href: `/${subject.slug}`, label: subject.name },
          { href: `/${subject.slug}/${gradeSlug(grade)}`, label: `Lớp ${grade}` },
          { href: `${courseHref(course)}#tuan-${week.number}`, label: `Tuần ${week.number}` },
        ]}
      />

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <article>
          <header>
            <p className="text-sm text-gray-600">
              Tuần {week.number} ({formatRange(week.startDate, week.endDate)}) · {ITEM_TYPE_LABELS[item.type]}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{item.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              {item.isFree ? <FreeBadge /> : <LockBadge />}
              <LevelBadge level={item.level} />
              {item.durationMinutes && <span className="text-gray-700">Thời gian: {item.durationMinutes} phút</span>}
              {/* Lượt học sẽ đếm thật từ Giai đoạn 4 */}
              <span className="text-gray-600">· Lượt học: chưa thống kê</span>
            </div>
            <div className="no-print mt-4 flex flex-wrap gap-3">
              {practice ? (
                <Link href={itemHref(course, week, practice)} className="rounded-full bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">
                  Luyện tập
                </Link>
              ) : item.type !== "document" ? (
                <a href="#bai-lam" className="rounded-full bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">
                  Luyện tập
                </a>
              ) : null}
              <PrintButton />
            </div>
          </header>

          <section id="bai-lam" className="mt-6 scroll-mt-28">
            {!allowed ? (
              <LockedNotice />
            ) : item.type === "video" ? (
              <VideoEmbed videoRef={item.videoRef} title={item.title} />
            ) : item.type === "document" ? (
              <DocumentBox url={item.url} />
            ) : (
              <WorksheetFrame url={item.url} title={item.title} />
            )}
          </section>

          {/* Bài trắc nghiệm bên dưới video */}
          {allowed && practice && (
            <section className="mt-8">
              <h2 className="text-xl font-bold text-gray-900">Luyện tập sau bài giảng</h2>
              <p className="mb-3 text-sm text-gray-600">{practice.title}</p>
              {canViewItem(practice) ? <WorksheetFrame url={practice.url} title={practice.title} /> : <LockedNotice />}
            </section>
          )}

          <section className="no-print mt-8 rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="font-bold text-gray-900">Thảo luận</h2>
            <p className="mt-1 text-sm text-gray-600">Mục hỏi đáp sẽ mở ở giai đoạn sau (có cô kiểm duyệt trước khi hiển thị).</p>
          </section>
        </article>

        <aside className="no-print space-y-6">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="font-bold text-gray-900">Cùng bài học</h2>
            <ul className="mt-2 space-y-1">
              {week.items.map((it) => (
                <li key={it.id}>
                  <Link
                    href={itemHref(course, week, it)}
                    aria-current={it.id === item.id ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-lg p-2 text-sm ${it.id === item.id ? "bg-brand-50 font-semibold text-brand-800" : "hover:bg-gray-50"}`}
                  >
                    <ItemIcon type={it.type} />
                    <span className="min-w-0 flex-1">{it.title}</span>
                    {it.isFree && <FreeBadge />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="font-bold text-gray-900">Cùng lớp học</h2>
            <ul className="mt-2 space-y-1">
              {nearby.map((w) => (
                <li key={w.id}>
                  <Link href={itemHref(course, w, w.items[0])} className="block rounded-lg p-2 text-sm hover:bg-gray-50">
                    <span className="font-semibold text-brand-700">Tuần {w.number}:</span> {w.title}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={courseHref(course)} className="mt-2 inline-block text-sm font-semibold text-brand-700 underline">
              Xem cả {weeks.length} tuần
            </Link>
          </div>
        </aside>
      </div>
    </Container>
  );
}

function LockedNotice() {
  return (
    <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-6 text-center">
      <p className="text-4xl" aria-hidden>🔒</p>
      <p className="mt-2 text-lg font-bold text-brand-800">Bài này dành cho học sinh đã đăng ký gói học</p>
      <p className="mt-1 text-gray-700">Phụ huynh đăng ký gói Toán lớp này để mở toàn bộ bài giảng và phiếu luyện tập.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link href="/thanh-toan" className="rounded-full bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">Đăng ký gói học</Link>
        <Link href="/hoc-thu" className="rounded-full border-2 border-brand-600 px-5 py-2.5 font-semibold text-brand-700">Học thử miễn phí</Link>
      </div>
    </div>
  );
}

function DocumentBox({ url: raw }: { url: string | null }) {
  const url = safeWorksheetUrl(raw);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
      <p className="text-4xl" aria-hidden>📄</p>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-full bg-brand-600 px-5 py-2.5 font-semibold text-white">
          Tải tài liệu
        </a>
      ) : (
        <p className="mt-2 font-semibold text-gray-700">Tài liệu đang được cô cập nhật.</p>
      )}
    </div>
  );
}
