import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Container, PageHero } from "@/components/ui";
import { courseHref, courseStats, getCourses, getSubject, gradeSlug, parseGradeSlug, SUBJECTS, TRACK_LABELS } from "@/lib/content";

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
      <PageHero title={`${subject.name} lớp ${grade}`} subtitle="Chọn hướng học phù hợp với con.">
        <div className="mb-3 [&_a]:text-white [&_span]:text-white">
          <Breadcrumbs items={[{ href: `/${subject.slug}`, label: subject.name }, { label: `Lớp ${grade}` }]} />
        </div>
      </PageHero>
      <Container className="py-8">
        {/* Chỉ hiện những hướng học đã có nội dung */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const s = courseStats(c);
            const label = TRACK_LABELS[c.track];
            return (
              <Link key={c.id} href={courseHref(c)} className="group rounded-3xl border-2 border-brand-200 bg-white p-6 shadow-sm hover:border-brand-500">
                <p className="text-sm font-semibold uppercase text-accent-700">Kết nối tri thức</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 group-hover:text-brand-700">{label.name}</p>
                <p className="mt-1 text-gray-700">{label.description}</p>
                <ul className="mt-4 flex flex-wrap gap-2 text-sm">
                  <li className="rounded-full bg-brand-50 px-3 py-1 text-brand-800">{s.weeks} tuần</li>
                  <li className="rounded-full bg-brand-50 px-3 py-1 text-brand-800">{s.videos} video</li>
                  <li className="rounded-full bg-accent-50 px-3 py-1 text-accent-700">{s.worksheets} phiếu</li>
                  <li className="rounded-full bg-accent-50 px-3 py-1 text-accent-700">{s.tests} đề</li>
                </ul>
                <p className="mt-4 font-semibold text-brand-700">Vào học →</p>
              </Link>
            );
          })}
        </div>
      </Container>
    </>
  );
}
