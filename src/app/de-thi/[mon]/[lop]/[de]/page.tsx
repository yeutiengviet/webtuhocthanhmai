import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PdfDownloadButton, UploadedPdf, UploadedWorksheetFrame, WorksheetFrame } from "@/components/LessonMedia";
import { PrintButton } from "@/components/PrintButton";
import { Breadcrumbs, Container, FreeBadge, ItemIcon, LockBadge } from "@/components/ui";
import { getSubject, gradeSlug, parseGradeSlug } from "@/lib/content";
import { EXAM_CATEGORY_LABELS, examHref, examMedia } from "@/lib/exam-meta";
import { examDecision } from "@/lib/download-access-server";
import { findPublishedExam, listPublishedExams } from "@/lib/exams";

// Nút tải xanh/xám tùy quyền tải của người đang xem → BẮT BUỘC render động, không lưu đệm chung giữa người xem.
export const dynamic = "force-dynamic";

type Params = Promise<{ mon: string; lop: string; de: string }>;

async function load(p: Awaited<Params>) {
  const subject = getSubject(p.mon);
  const grade = parseGradeSlug(p.lop);
  if (!subject || !grade) return null;
  const exam = await findPublishedExam(subject.slug, grade, p.de);
  return exam ? { subject, grade, exam } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const d = await load(await params);
  return { title: d ? d.exam.title : "Không tìm thấy trang" };
}

export default async function ExamPage({ params }: { params: Params }) {
  const d = await load(await params);
  if (!d) notFound();
  const { subject, grade, exam } = d;
  const media = examMedia(exam);
  const [list, dl] = await Promise.all([listPublishedExams(subject.slug, grade), examDecision(exam.id)]);
  const others = list.exams.filter((e) => e.id !== exam.id);

  return (
    <Container className="py-5">
      <Breadcrumbs
        items={[
          { href: "/de-thi", label: "Đề thi" },
          { href: `/de-thi/${subject.slug}`, label: subject.name },
          { href: `/de-thi/${subject.slug}/${gradeSlug(grade)}`, label: `Lớp ${grade}` },
        ]}
      />
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <article>
          <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-50 via-brand-50 to-accent-50 p-5 ring-1 ring-violet-200 sm:p-7">
            <p className="text-sm font-bold text-violet-800">
              {subject.name} lớp {grade} · {EXAM_CATEGORY_LABELS[exam.category]}
            </p>
            <h1 className="mt-1 text-3xl text-gray-900 sm:text-4xl">{exam.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
              {exam.isFree ? <FreeBadge /> : <LockBadge />}
              {exam.durationMinutes && <span className="text-gray-700">⏱ Thời gian: {exam.durationMinutes} phút</span>}
              <span className="text-gray-600">· Điểm của con: hiện khi con đăng nhập</span>
            </div>
            <div className="no-print mt-5 flex flex-wrap gap-3">
              {media.kind === "open" && media.main && media.main.type !== "pdf" && (
                <a href="#bai-lam" className="btn-toy inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-extrabold text-white"><span aria-hidden>✏️</span> Làm bài trực tuyến</a>
              )}
              {media.kind === "open" && media.pdf && <PdfDownloadButton src={media.pdf} fileName={`${exam.slug}.pdf`} title={exam.title} viewHref={media.main?.type === "pdf" ? "#bai-lam" : undefined} decision={dl} />}
              {!(media.kind === "open" && media.pdf) && <PrintButton decision={dl} />}
            </div>
          </header>

          <section id="bai-lam" className="mt-6 scroll-mt-28">
            {media.kind === "locked" ? (
              <div className="rounded-[2rem] border-2 border-dashed border-brand-300 bg-white p-8 text-center">
                <p className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-3xl" aria-hidden>🔒</p>
                <p className="mt-3 font-display text-2xl font-extrabold text-brand-700">Đề này cô đang cập nhật</p>
                <p className="mt-1 text-gray-700">Phụ huynh quay lại sau ít hôm nhé. Trong lúc chờ, con có thể làm các đề khác của lớp.</p>
                <Link href={`/de-thi/${subject.slug}/${gradeSlug(grade)}`} className="btn-toy mt-4 inline-block rounded-full bg-brand-600 px-6 py-3 font-extrabold text-white">Xem đề khác</Link>
              </div>
            ) : media.main?.type === "external" ? (
              <WorksheetFrame url={media.main.url} title={exam.title} />
            ) : media.main?.type === "html" ? (
              <UploadedWorksheetFrame src={media.main.src} title={exam.title} />
            ) : media.main?.type === "pdf" ? (
              <UploadedPdf src={media.main.src} title={exam.title} />
            ) : (
              <WorksheetFrame url={null} title={exam.title} />
            )}
          </section>
        </article>

        <aside className="no-print">
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
            <h2 className="text-xl text-gray-900">Đề khác của lớp {grade}</h2>
            {others.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">Cô đang cập nhật thêm đề.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {others.map((e) => (
                  <li key={e.id}>
                    <Link href={examHref(e)} className="flex items-center gap-2 rounded-2xl p-2 text-sm font-semibold hover:bg-violet-50">
                      <ItemIcon type="test" />
                      <span className="min-w-0 flex-1">{e.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/de-thi/${subject.slug}`} className="mt-2 inline-block py-2 text-sm font-extrabold text-brand-700 underline">Tất cả đề {subject.name}</Link>
          </div>
        </aside>
      </div>
    </Container>
  );
}
