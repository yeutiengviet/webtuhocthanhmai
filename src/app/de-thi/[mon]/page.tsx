import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExamTable } from "@/components/ExamTable";
import { Breadcrumbs, Container, GRADE_THEME, PageHero } from "@/components/ui";
import { getSubject, GRADES, gradeSlug, SUBJECTS } from "@/lib/content";
import { listPublishedExams } from "@/lib/exams";

/** Số đề hiện ở mỗi lớp trên trang tổng hợp; xem thêm bằng nút "Xem tất cả". */
const PREVIEW = 5;

// Lưu sẵn trang, tự làm mới mỗi 60 giây; quản trị thêm/sửa/xóa đề thì làm mới ngay (revalidatePath).
export const revalidate = 60;

export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ mon: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ mon: string }> }): Promise<Metadata> {
  const s = getSubject((await params).mon);
  return { title: s ? `Đề thi ${s.name}` : "Không tìm thấy trang" };
}

export default async function ExamsBySubject({ params }: { params: Promise<{ mon: string }> }) {
  const subject = getSubject((await params).mon);
  if (!subject) notFound();
  const { exams: all, error } = await listPublishedExams(subject.slug);

  return (
    <>
      <PageHero badge="⏱ Đề thi" title={`Đề thi ${subject.name}`} subtitle="Đề có nhãn Free làm thử được ngay. Điểm của con và điểm cao nhất sẽ hiện khi con đăng nhập.">
        <div className="mb-2">
          <Breadcrumbs items={[{ href: "/de-thi", label: "Đề thi" }, { label: subject.name }]} />
        </div>
      </PageHero>
      <Container className="space-y-8 py-8">
        <nav aria-label="Chọn môn" className="flex gap-2">
          {SUBJECTS.map((s) => (
            <Link
              key={s.slug}
              href={`/de-thi/${s.slug}`}
              aria-current={s.slug === subject.slug ? "page" : undefined}
              className={`rounded-full px-5 py-2 font-extrabold ring-2 ${s.slug === subject.slug ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-brand-700 ring-brand-200"}`}
            >
              {s.name}
            </Link>
          ))}
        </nav>
        {GRADES.map((g) => {
          const exams = all.filter((e) => e.grade === g);
          const t = GRADE_THEME[g];
          return (
            <section key={g} aria-labelledby={`lop-${g}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id={`lop-${g}`} className="flex items-center gap-2 text-2xl text-gray-900">
                  <span aria-hidden className={`grid h-10 w-10 place-items-center rounded-xl text-xl ${t.soft}`}>{t.emoji}</span>
                  Lớp {g}
                </h2>
                {exams.length > 0 && (
                  <Link href={`/de-thi/${subject.slug}/${gradeSlug(g)}`} className="py-2 text-sm font-extrabold text-brand-700 underline">
                    Xem tất cả ({exams.length})
                  </Link>
                )}
              </div>
              <ExamTable exams={exams.slice(0, PREVIEW)} error={error} />
            </section>
          );
        })}
      </Container>
    </>
  );
}
