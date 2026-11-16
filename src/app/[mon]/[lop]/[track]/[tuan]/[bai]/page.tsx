import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PdfDownloadButton, UploadedPdf, UploadedWorksheetFrame, VideoEmbed, WorksheetFrame } from "@/components/LessonMedia";
import { PrintButton } from "@/components/PrintButton";
import { Breadcrumbs, Container, FreeBadge, ItemIcon, LevelBadge, LockBadge } from "@/components/ui";
import {
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
  isTrack,
  lessonMedia,
  publishedWeeks,
  unitName,
  weekLabel,
  weekSlug,
} from "@/lib/content";
import { formatRange } from "@/lib/dates";
import { getPublishedLessonFiles } from "@/lib/lesson-files";
import type { LessonFileInfo, LessonMedia } from "@/lib/content";
import type { Item } from "@/lib/types";
import { safeDocumentUrl } from "@/lib/urls";

// LƯU Ý GIAI ĐOẠN 3: khi kiểm tra gói học theo người đăng nhập, BẮT BUỘC chuyển sang render động (dynamic)
// + Cache-Control: private, no-store, để trang của người đã trả phí không bao giờ bị lưu đệm rồi phát cho người khác.
// Hiện tại: trang dựng ở lần mở đầu rồi lưu sẵn, tự làm mới mỗi 60 giây; cô tải phiếu lên thì làm mới ngay (revalidatePath).
export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

type Params = Promise<{ mon: string; lop: string; track: string; tuan: string; bai: string }>;

function load(p: Awaited<Params>) {
  const subject = getSubject(p.mon);
  const grade = parseGradeSlug(p.lop);
  if (!subject || !grade || !isTrack(p.track)) return null;
  const course = getCourse(p.mon, grade, p.track);
  const week = course && findWeek(course, p.tuan);
  const item = week && findItem(week, p.bai);
  return course && week && item ? { subject, grade, course, week, item } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const d = load(await params);
  return d ? { title: `${d.item.title} – ${weekLabel(d.course, d.week)}` } : { title: "Không tìm thấy trang" };
}

export default async function LessonPage({ params }: { params: Params }) {
  const d = load(await params);
  if (!d) notFound();
  const { subject, grade, course, week, item } = d;
  // Mọi nội dung (mã video, link phiếu) chỉ lấy qua lessonMedia() — mục bị khóa không có dữ liệu này.
  const files = await getPublishedLessonFiles(week.items.map((i) => i.id));
  const media = lessonMedia(item, canViewItem, files.get(item.id));

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
          { href: `${courseHref(course)}#${weekSlug(week)}`, label: weekLabel(course, week) },
        ]}
      />

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <article>
          <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-100 via-brand-50 to-accent-50 p-5 ring-1 ring-brand-200 sm:p-7">
            <span aria-hidden className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-200/60" />
            <p className="relative text-sm font-bold text-brand-700">
              {weekLabel(course, week)}{course.track === "nang-cao" || week.kind !== "hoc" ? "" : ` (${formatRange(week.startDate, week.endDate)})`} · {ITEM_TYPE_LABELS[item.type]}
            </p>
            <h1 className="relative mt-1 text-3xl text-gray-900 sm:text-4xl">{item.title}</h1>
            <div className="relative mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
              {media.kind !== "locked" ? <FreeBadge /> : <LockBadge />}
              <LevelBadge level={item.level} />
              {item.durationMinutes && <span className="text-gray-700">Thời gian: {item.durationMinutes} phút</span>}
              {/* Lượt học sẽ đếm thật từ Giai đoạn 4 */}
              <span className="text-gray-600">· Lượt học: chưa thống kê</span>
            </div>
            <div className="no-print relative mt-5 flex flex-wrap gap-3">
              {practice ? (
                <Link href={itemHref(course, week, practice)} className="btn-toy inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-extrabold text-white">
                  <span aria-hidden>✏️</span> Luyện tập
                </Link>
              ) : item.type !== "document" && !(media.kind === "worksheet" && !media.htmlSrc && !media.url && media.pdf) ? (
                <a href="#bai-lam" className="btn-toy inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-extrabold text-white">
                  <span aria-hidden>✏️</span> Luyện tập
                </a>
              ) : null}
              {(media.kind === "worksheet" || media.kind === "document") && media.pdf ? (
                <PdfDownloadButton src={media.pdf} fileName={`${item.id}.pdf`} />
              ) : (
                <PrintButton />
              )}
            </div>
          </header>

          <section id="bai-lam" className="mt-6 scroll-mt-28">
            {media.kind === "locked" ? (
              <LockedNotice />
            ) : media.kind === "video" ? (
              <VideoEmbed videoRef={media.videoRef} title={item.title} />
            ) : media.kind === "document" ? (
              <DocumentBox url={media.url} pdf={media.pdf} />
            ) : (
              <WorksheetView media={media} title={item.title} />
            )}
          </section>

          {/* Bài trắc nghiệm bên dưới video */}
          {media.kind !== "locked" && practice && (
            <section className="mt-8">
              <h2 className="text-2xl text-gray-900"><span aria-hidden>✏️</span> Luyện tập sau bài giảng</h2>
              <p className="mb-3 text-sm text-gray-600">{practice.title}</p>
              <PracticeBlock item={practice} file={files.get(practice.id)} />
            </section>
          )}

          <section className="no-print mt-8 rounded-3xl bg-white p-5 ring-1 ring-gray-100">
            <h2 className="text-xl text-gray-900"><span aria-hidden>💬</span> Thảo luận</h2>
            <p className="mt-1 text-sm text-gray-600">Mục hỏi đáp sẽ mở ở giai đoạn sau (có cô kiểm duyệt trước khi hiển thị).</p>
          </section>
        </article>

        <aside className="no-print space-y-6">
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
            <h2 className="text-xl text-gray-900"><span aria-hidden>📚</span> Cùng bài học</h2>
            <ul className="mt-2 space-y-1">
              {week.items.map((it) => (
                <li key={it.id}>
                  <Link
                    href={itemHref(course, week, it)}
                    aria-current={it.id === item.id ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-2xl p-2 text-sm font-semibold ${it.id === item.id ? "bg-brand-50 text-brand-800 ring-2 ring-brand-200" : "hover:bg-gray-50"}`}
                  >
                    <ItemIcon type={it.type} />
                    <span className="min-w-0 flex-1">{it.title}</span>
                    {(it.isFree || files.get(it.id)?.isFree) && <FreeBadge />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-accent-100">
            <h2 className="text-xl text-gray-900"><span aria-hidden>🏫</span> Cùng lớp học</h2>
            <ul className="mt-2 space-y-1">
              {nearby.filter((w) => w.items.length > 0).map((w) => (
                <li key={w.id}>
                  <Link href={itemHref(course, w, w.items[0])} className="block rounded-2xl p-2 text-sm hover:bg-accent-50">
                    <span className="font-extrabold text-accent-700">{weekLabel(course, w)}:</span> {w.title}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={courseHref(course)} className="mt-2 inline-block text-sm font-semibold text-brand-700 underline">
              Xem cả {weeks.length} {unitName(course).toLowerCase()}
            </Link>
          </div>
        </aside>
      </div>
    </Container>
  );
}

function PracticeBlock({ item, file }: { item: Item; file?: LessonFileInfo }) {
  const m = lessonMedia(item, canViewItem, file);
  if (m.kind !== "worksheet") return <LockedNotice />;
  return (
    <div className="space-y-3">
      <WorksheetView media={m} title={item.title} />
      {m.pdf && (m.htmlSrc || m.url) && <PdfDownloadButton src={m.pdf} fileName={`${item.id}.pdf`} />}
    </div>
  );
}

/** Phiếu: ưu tiên phiếu tương tác cô tải lên → link phiếu cũ → chỉ có PDF thì xem PDF. */
function WorksheetView({ media, title }: { media: Extract<LessonMedia, { kind: "worksheet" }>; title: string }) {
  if (media.htmlSrc) return <UploadedWorksheetFrame src={media.htmlSrc} title={title} />;
  if (media.url) return <WorksheetFrame url={media.url} title={title} />;
  if (media.pdf) return <UploadedPdf src={media.pdf} title={title} />;
  return <WorksheetFrame url={null} title={title} />;
}

function LockedNotice() {
  return (
    <div className="rounded-[2rem] border-2 border-dashed border-brand-300 bg-white p-8 text-center">
      <p className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-3xl" aria-hidden>🔒</p>
      <p className="mt-3 font-display text-2xl font-extrabold text-brand-700">Bài này dành cho học sinh đã đăng ký gói học</p>
      <p className="mt-1 text-gray-700">Phụ huynh đăng ký gói Toán lớp này để mở toàn bộ bài giảng và phiếu luyện tập.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link href="/thanh-toan" className="btn-toy rounded-full bg-brand-600 px-6 py-3 font-extrabold text-white">Đăng ký gói học</Link>
      </div>
    </div>
  );
}

function DocumentBox({ url: raw, pdf }: { url: string | null; pdf?: string }) {
  if (pdf) {
    return (
      <div className="space-y-3">
        <UploadedPdf src={pdf} title="Tài liệu PDF" />
      </div>
    );
  }
  const url = safeDocumentUrl(raw);
  return (
    <div className="rounded-[2rem] bg-white p-8 text-center ring-1 ring-gray-100">
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
