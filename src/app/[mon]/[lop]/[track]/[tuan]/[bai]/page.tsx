import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PdfDownloadButton, UploadedPdf, UploadedWorksheetFrame, VideoEmbed, WorksheetFrame } from "@/components/LessonMedia";
import { PrintButton } from "@/components/PrintButton";
import { Breadcrumbs, Container, FreeBadge, ItemIcon, LevelBadge, LockBadge } from "@/components/ui";
import {
  canViewItem,
  courseHref,
  isCourseLocked,
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
  parentItem,
  publishedWeeks,
  subItems,
  unitName,
  visibleItems,
  weekLabel,
  weekSlug,
} from "@/lib/content";
import { formatRange } from "@/lib/dates";
import { blockedMessage, type DownloadDecision } from "@/lib/download-access";
import { lessonDecision } from "@/lib/download-access-server";
import { getPublishedLessonFiles } from "@/lib/lesson-files";
import { getViewer } from "@/lib/supabase/server";
import type { LessonFileInfo, LessonMedia } from "@/lib/content";
import type { Course, Item, Week } from "@/lib/types";
import { safeDocumentUrl } from "@/lib/urls";

// Trang kiểm tra người xem đã đăng nhập chưa (phụ huynh có tài khoản miễn phí xem được mọi bài)
// → BẮT BUỘC render động, không lưu đệm chung, để trang của người đã đăng nhập không bị phát cho khách.
export const dynamic = "force-dynamic";

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
  if (isCourseLocked(course)) return <LockedCourse subject={subject.slug} grade={grade} />;
  // Mọi nội dung (mã video, link phiếu) chỉ lấy qua lessonMedia() — mục bị khóa không có dữ liệu này.
  const [files, viewer, dl] = await Promise.all([getPublishedLessonFiles(week.items.map((i) => i.id)), getViewer(), lessonDecision(item.id)]);
  const loggedIn = Boolean(viewer);
  const canView = (it: Item) => canViewItem(it, loggedIn);
  const media = lessonMedia(item, canView, files.get(item.id));
  // Mục nhiều phiếu: các phiếu đã có file; phiếu con: mục cha để quay lại
  const kids = subItems(week.items, item).filter((k) => files.get(k.id)?.hasHtml || files.get(k.id)?.hasPdf);
  const parent = parentItem(week.items, item);

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
          ...(parent ? [{ href: itemHref(course, week, parent), label: parent.title }] : []),
        ]}
      />

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <article>
          <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-100 via-brand-50 to-accent-50 p-5 ring-1 ring-brand-200 sm:p-7">
            <span aria-hidden className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-200/60" />
            <p className="relative text-sm font-bold text-brand-700">
              {weekLabel(course, week)}{course.track !== "theo-tuan" || week.kind !== "hoc" ? "" : ` (${formatRange(week.startDate, week.endDate)})`} · {ITEM_TYPE_LABELS[item.type]}
            </p>
            <h1 className="relative mt-1 text-3xl text-gray-900 sm:text-4xl">{item.title}</h1>
            <div className="relative mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
              {media.kind !== "locked" ? <FreeBadge /> : <LockBadge />}
              <LevelBadge level={item.level} />
              {item.durationMinutes && <span className="text-gray-700">Thời gian: {item.durationMinutes} phút</span>}
              {/* Lượt học sẽ đếm thật từ Giai đoạn 4 */}
              <span className="text-gray-600">· Lượt học: chưa thống kê</span>
            </div>
            {!item.multi && <div className="no-print relative mt-5 flex flex-wrap gap-3">
              {practice ? (
                <Link href={itemHref(course, week, practice)} className="btn-toy inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-extrabold text-white">
                  <span aria-hidden>✏️</span> Luyện tập
                </Link>
              ) : item.type !== "document" && item.type !== "images" && !(media.kind === "worksheet" && !media.htmlSrc && !media.url && media.pdf) ? (
                <a href="#bai-lam" className="btn-toy inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-extrabold text-white">
                  <span aria-hidden>✏️</span> Luyện tập
                </a>
              ) : null}
              {(media.kind === "worksheet" || media.kind === "document") && media.pdf ? (
                <PdfDownloadButton
                  src={media.pdf}
                  fileName={`${item.id}.pdf`}
                  title={item.title}
                  viewHref={media.kind === "document" || (!media.htmlSrc && !media.url) ? "#bai-lam" : undefined}
                  decision={dl}
                />
              ) : (
                <PrintButton decision={dl} />
              )}
            </div>}
          </header>

          <section id="bai-lam" className="mt-6 scroll-mt-28">
            {item.multi ? (
              <SheetList course={course} week={week} items={kids} open={(k) => canView(k) || Boolean(files.get(k.id)?.isFree)} title={item.title} />
            ) : media.kind === "locked" ? (
              <LockedNotice />
            ) : media.kind === "video" ? (
              <VideoEmbed videoRef={media.videoRef} title={item.title} />
            ) : media.kind === "document" ? (
              <DocumentBox url={media.url} pdf={media.pdf} decision={dl} />
            ) : media.kind === "images" ? (
              <ImageGallery images={media.images} title={item.title} />
            ) : (
              <WorksheetView media={media} title={item.title} />
            )}
          </section>

          {/* Bài trắc nghiệm bên dưới video */}
          {media.kind !== "locked" && practice && (
            <section className="mt-8">
              <h2 className="text-2xl text-gray-900"><span aria-hidden>✏️</span> Luyện tập sau bài giảng</h2>
              <p className="mb-3 text-sm text-gray-600">{practice.title}</p>
              <PracticeBlock item={practice} file={files.get(practice.id)} canView={canView} decision={dl} />
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
              {visibleItems(week.items, files).map((it) => (
                <li key={it.id}>
                  <Link
                    href={itemHref(course, week, it)}
                    aria-current={it.id === item.id || it.id === parent?.id ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-2xl p-2 text-sm font-semibold ${it.id === item.id || it.id === parent?.id ? "bg-brand-50 text-brand-800 ring-2 ring-brand-200" : "hover:bg-gray-50"}`}
                  >
                    <ItemIcon type={it.type} />
                    <span className="min-w-0 flex-1">{it.title}</span>
                    {(loggedIn || it.isFree || files.get(it.id)?.isFree) && <FreeBadge />}
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

/** Danh sách các phiếu trong một mục nhiều phiếu (vd. "Phiếu bài tập hàng ngày"). */
function SheetList({ course, week, items, open, title }: { course: Course; week: Week; items: Item[]; open: (it: Item) => boolean; title: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[2rem] border-2 border-dashed border-brand-200 bg-white p-8 text-center">
        <p className="text-3xl" aria-hidden>📚</p>
        <p className="mt-2 font-extrabold text-brand-700">Cô Thanh Mai đang cập nhật {title.toLowerCase()} của tuần này.</p>
      </div>
    );
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((k) => (
        <li key={k.id}>
          <Link href={itemHref(course, week, k)} className="card-lift flex h-full items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-brand-100">
            <ItemIcon type={k.type} />
            <span className="min-w-0 flex-1 font-bold text-gray-900">{k.title.replace(/^.*– /, "")}</span>
            {open(k) ? <FreeBadge /> : <LockBadge />}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Phiếu luyện tập cùng tuần với bài giảng → cùng khoảng thời gian, dùng chung quyền tải.
function PracticeBlock({ item, file, canView, decision }: { item: Item; file?: LessonFileInfo; canView: (it: Item) => boolean; decision: DownloadDecision }) {
  const m = lessonMedia(item, canView, file);
  if (m.kind !== "worksheet") return <LockedNotice />;
  return (
    <div className="space-y-3">
      <WorksheetView media={m} title={item.title} />
      {m.pdf && (m.htmlSrc || m.url) && <PdfDownloadButton src={m.pdf} fileName={`${item.id}.pdf`} title={item.title} decision={decision} />}
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

/** Ảnh cô tải lên (vd. sơ đồ tư duy), xếp lần lượt từ trên xuống; bấm vào ảnh để mở cỡ lớn. */
function ImageGallery({ images, title }: { images: string[]; title: string }) {
  if (images.length === 0) {
    return (
      <div className="rounded-[2rem] border-2 border-dashed border-brand-200 bg-white p-8 text-center">
        <p className="text-3xl" aria-hidden>🧠</p>
        <p className="mt-2 font-extrabold text-brand-700">Cô Thanh Mai đang cập nhật {title.toLowerCase()}.</p>
      </div>
    );
  }
  return (
    <ol className="space-y-4">
      {images.map((src, i) => (
        <li key={src} className="overflow-hidden rounded-[2rem] bg-white p-2 shadow-sm ring-1 ring-brand-100">
          <a href={src} target="_blank" rel="noopener" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh riêng tư phục vụ qua route có kiểm tra quyền */}
            <img src={src} alt={`${title} – ảnh ${i + 1}/${images.length}`} loading={i === 0 ? "eager" : "lazy"} className="mx-auto h-auto w-full rounded-[1.5rem]" />
          </a>
          {images.length > 1 && <p className="mt-1 text-center text-sm font-semibold text-gray-600">Ảnh {i + 1}/{images.length}</p>}
        </li>
      ))}
    </ol>
  );
}

function LockedNotice() {
  return (
    <div className="rounded-[2rem] border-2 border-dashed border-brand-300 bg-white p-8 text-center">
      <p className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-3xl" aria-hidden>🔒</p>
      <p className="mt-3 font-display text-2xl font-extrabold text-brand-700">Đăng nhập để học bài này</p>
      <p className="mt-1 text-gray-700">Phụ huynh tạo tài khoản <strong>miễn phí</strong> (bằng số điện thoại hoặc email) để mở toàn bộ bài giảng và phiếu luyện tập cho con.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link href="/dang-nhap?tab=dang-ky" className="btn-toy rounded-full bg-brand-600 px-6 py-3 font-extrabold text-white">Tạo tài khoản miễn phí</Link>
        <Link href="/dang-nhap" className="rounded-full bg-white px-6 py-3 font-extrabold text-brand-700 ring-2 ring-brand-200">Đăng nhập</Link>
      </div>
    </div>
  );
}

/** Khóa đang tạm khóa (Toán nâng cao): không đưa bất kỳ nội dung bài nào ra trang. */
function LockedCourse({ subject, grade }: { subject: string; grade: number }) {
  return (
    <Container className="py-8">
      <div className="rounded-[2rem] border-2 border-dashed border-brand-300 bg-white p-8 text-center">
        <p className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-3xl" aria-hidden>🔒</p>
        <p className="mt-3 font-display text-2xl font-extrabold text-brand-700">Mục nâng cao đang tạm khóa</p>
        <p className="mt-1 text-gray-700">Phần Toán nâng cao chưa mở cho tài khoản miễn phí. Con học các mục khác của lớp {grade} nhé.</p>
        <Link href={`/${subject}/${gradeSlug(grade)}`} className="btn-toy mt-4 inline-block rounded-full bg-brand-600 px-6 py-3 font-extrabold text-white">Về trang lớp {grade}</Link>
      </div>
    </Container>
  );
}

function DocumentBox({ url: raw, pdf, decision }: { url: string | null; pdf?: string; decision: DownloadDecision }) {
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
      {url && decision.ok ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-full bg-brand-600 px-5 py-2.5 font-semibold text-white">
          Tải tài liệu
        </a>
      ) : url ? (
        <button type="button" disabled aria-disabled="true" title={decision.ok ? undefined : blockedMessage(decision.reason)} className="mt-3 inline-block cursor-not-allowed rounded-full bg-gray-300 px-5 py-2.5 font-semibold text-gray-600">
          Tải tài liệu
        </button>
      ) : (
        <p className="mt-2 font-semibold text-gray-700">Tài liệu đang được cô cập nhật.</p>
      )}
    </div>
  );
}
