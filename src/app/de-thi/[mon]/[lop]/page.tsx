import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExamTable } from "@/components/ExamTable";
import { Breadcrumbs, Container, PageHero } from "@/components/ui";
import { getExams, getSubject, GRADES, gradeSlug, parseGradeSlug, SUBJECTS } from "@/lib/content";

export function generateStaticParams() {
  return SUBJECTS.flatMap((s) => GRADES.map((g) => ({ mon: s.slug, lop: gradeSlug(g) })));
}

type Params = Promise<{ mon: string; lop: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { mon, lop } = await params;
  const s = getSubject(mon);
  const g = parseGradeSlug(lop);
  return { title: s && g ? `Đề thi ${s.name} lớp ${g}` : "Không tìm thấy trang" };
}

export default async function ExamsByGrade({ params }: { params: Params }) {
  const { mon, lop } = await params;
  const subject = getSubject(mon);
  const grade = parseGradeSlug(lop);
  if (!subject || !grade) notFound();
  const exams = getExams(subject.slug, grade);

  return (
    <>
      <PageHero badge="⏱ Đề thi" title={`Đề thi ${subject.name} lớp ${grade}`} subtitle={`${exams.length} đề`}>
        <div className="mb-2">
          <Breadcrumbs items={[{ href: "/de-thi", label: "Đề thi" }, { href: `/de-thi/${subject.slug}`, label: subject.name }, { label: `Lớp ${grade}` }]} />
        </div>
      </PageHero>
      <Container className="py-8">
        <ExamTable exams={exams} />
      </Container>
    </>
  );
}
