import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, GRADE_THEME, PageHero } from "@/components/ui";
import { getCourses, getSubject, GRADES, gradeSlug, SUBJECTS } from "@/lib/content";

export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ mon: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ mon: string }> }): Promise<Metadata> {
  const { mon } = await params;
  return { title: getSubject(mon)?.name ?? "Không tìm thấy trang" };
}

export default async function SubjectPage({ params }: { params: Promise<{ mon: string }> }) {
  const { mon } = await params;
  const subject = getSubject(mon);
  if (!subject) notFound();

  const t = (g: number) => GRADE_THEME[g];
  return (
    <>
      <PageHero badge="Sách Kết nối tri thức với cuộc sống" title={`Môn ${subject.name}`} subtitle={subject.shortDescription + "."} />
      <Container className="py-8">
        <h2 className="mb-4 text-2xl text-gray-900">Chọn lớp của con</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {GRADES.map((g) => {
            const has = getCourses(subject.slug, g).length > 0;
            const card = (
              <>
                <span aria-hidden className={`absolute -right-5 -top-5 h-16 w-16 rounded-full ${t(g).soft}`} />
                <span aria-hidden className="relative text-3xl">{t(g).emoji}</span>
                <p className="relative text-sm font-bold text-gray-600">{subject.name}</p>
                <p className={`relative font-display text-5xl font-extrabold leading-none ${has ? t(g).text : "text-gray-400"}`}>Lớp {g}</p>
                <p className={`relative mt-2 inline-block rounded-full px-3 py-1 text-xs font-extrabold ${has ? `${t(g).bg} text-white` : "bg-gray-100 text-gray-600"}`}>
                  {has ? "Vào học →" : "Sắp ra mắt"}
                </p>
              </>
            );
            return has ? (
              <Link key={g} href={`/${subject.slug}/${gradeSlug(g)}`} className={`card-lift relative overflow-hidden rounded-[2rem] bg-white p-5 text-center shadow-sm ring-2 ${t(g).ring}`}>
                {card}
              </Link>
            ) : (
              <div key={g} className="relative overflow-hidden rounded-[2rem] bg-white/70 p-5 text-center ring-2 ring-gray-100" aria-disabled>
                {card}
              </div>
            );
          })}
        </div>
      </Container>
    </>
  );
}
