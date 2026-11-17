import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Container, PageHero } from "@/components/ui";
import { features } from "@/data/site";
import { courseHref, courseStats, isCourseLocked, getCourses, getSubject, gradeSlug, parseGradeSlug, SUBJECTS, TRACK_LABELS } from "@/lib/content";

export function generateStaticParams() {
  // Chỉ tạo trang cho lớp đã có nội dung
  return SUBJECTS.flatMap((s) =>
    [...new Set(getCourses(s.slug).map((c) => c.grade))].map((g) => ({ mon: s.slug, lop: gradeSlug(g) })),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ mon: string; lop: string }> }): Promise<Metadata> {
  const { mon, lop } = await params;
  const subject = getSubject(mon);
  const grade = parseGradeSlug(lop);
  const ok = subject && grade && getCourses(subject.slug, grade).length > 0;
  return { title: ok ? `${subject.name} lớp ${grade}` : "Không tìm thấy trang" };
}

export default async function GradePage({ params }: { params: Promise<{ mon: string; lop: string }> }) {
  const { mon, lop } = await params;
  const subject = getSubject(mon);
  const grade = parseGradeSlug(lop);
  if (!subject || !grade) notFound();
  const courses = getCourses(subject.slug, grade);
  if (courses.length === 0) notFound();

  return (
    <>
      <PageHero badge="Sách Kết nối tri thức với cuộc sống" title={`${subject.name} lớp ${grade}`} subtitle="Chọn hướng học phù hợp với con.">
        <div className="mb-2">
          <Breadcrumbs items={[{ href: `/${subject.slug}`, label: subject.name }, { label: `Lớp ${grade}` }]} />
        </div>
      </PageHero>
      <Container className="py-8">
        {/* Chỉ hiện những hướng học đã có nội dung */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const s = courseStats(c);
            const label = TRACK_LABELS[c.track];
            const locked = isCourseLocked(c);
            const body = (
              <>
                <span aria-hidden className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-100" />
                <span aria-hidden className="absolute right-5 top-5 text-4xl">{c.track === "on-tap-he" ? "☀️" : "🎯"}</span>
                <p className="relative text-xs font-extrabold uppercase tracking-wider text-accent-700">Kết nối tri thức</p>
                <p className="relative mt-1 font-display text-3xl font-extrabold text-gray-900 group-hover:text-brand-700">{label.name}</p>
                <p className="relative mt-1 text-gray-700">{label.description}</p>
                <ul className="relative mt-4 flex flex-wrap gap-2 text-sm font-bold">
                  {c.track === "on-tap-he" ? (
                    <>
                      <li className="rounded-full bg-amber-50 px-3 py-1 text-amber-900 ring-1 ring-amber-200">☀️ {s.tests} đề</li>
                      <li className="rounded-full bg-brand-50 px-3 py-1 text-brand-800 ring-1 ring-brand-200">✏️ Làm trên web</li>
                      <li className="rounded-full bg-accent-50 px-3 py-1 text-accent-700 ring-1 ring-accent-200">{features.allowPdfDownload ? "⬇️ Tải PDF" : "📄 Xem PDF"}</li>
                    </>
                  ) : (
                    <>
                      <li className="rounded-full bg-brand-50 px-3 py-1 text-brand-800 ring-1 ring-brand-200">📚 {s.weeks} {c.track === "nang-cao" ? "chuyên đề" : "tuần"}</li>
                      <li className="rounded-full bg-brand-50 px-3 py-1 text-brand-800 ring-1 ring-brand-200">🎬 {s.videos} video</li>
                      {s.worksheets > 0 && <li className="rounded-full bg-accent-50 px-3 py-1 text-accent-700 ring-1 ring-accent-200">✏️ {s.worksheets} phiếu</li>}
                      {s.tests > 0 && <li className="rounded-full bg-violet-50 px-3 py-1 text-violet-800 ring-1 ring-violet-200">⏱ {s.tests} đề</li>}
                    </>
                  )}
                </ul>
                {locked ? (
                  <p className="relative mt-5 inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-5 py-2 font-extrabold text-gray-700"><span aria-hidden>🔒</span> Tạm khóa</p>
                ) : (
                  <p className="btn-toy relative mt-5 inline-block rounded-full bg-brand-600 px-5 py-2 font-extrabold text-white">Vào học →</p>
                )}
              </>
            );
            return locked ? (
              // Mục đang khóa: vẫn hiện ô nhưng không phải liên kết, không bấm vào được.
              <div key={c.id} aria-disabled="true" title="Mục nâng cao đang tạm khóa" className="relative cursor-not-allowed select-none overflow-hidden rounded-[2rem] bg-gray-50 p-6 opacity-75 ring-2 ring-gray-200">
                {body}
              </div>
            ) : (
              <Link key={c.id} href={courseHref(c)} className="card-lift group relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-md ring-2 ring-brand-200">
                {body}
              </Link>
            );
          })}
        </div>
      </Container>
    </>
  );
}
