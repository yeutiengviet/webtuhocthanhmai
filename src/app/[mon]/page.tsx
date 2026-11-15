import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, PageHero } from "@/components/ui";
import { getCourses, getSubject, GRADES, gradeSlug, SUBJECTS } from "@/lib/content";

export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ mon: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ mon: string }> }): Promise<Metadata> {
  const { mon } = await params;
  return { title: getSubject(mon)?.name };
}

export default async function SubjectPage({ params }: { params: Promise<{ mon: string }> }) {
  const { mon } = await params;
  const subject = getSubject(mon);
  if (!subject) notFound();

  return (
    <>
      <PageHero title={`Môn ${subject.name}`} subtitle={`${subject.shortDescription}. Theo sách Kết nối tri thức với cuộc sống.`} />
      <Container className="py-8">
        <h2 className="text-xl font-bold">Chọn lớp</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {GRADES.map((g) => {
            const has = getCourses(subject.slug, g).length > 0;
            const card = (
              <>
                <p className="text-sm text-gray-600">{subject.name}</p>
                <p className={`text-4xl font-extrabold ${has ? "text-brand-700" : "text-gray-400"}`}>Lớp {g}</p>
                <p className={`mt-1 text-sm font-medium ${has ? "text-green-700" : "text-gray-500"}`}>{has ? "Vào học →" : "Sắp ra mắt"}</p>
              </>
            );
            return has ? (
              <Link key={g} href={`/${subject.slug}/${gradeSlug(g)}`} className="rounded-2xl border-2 border-brand-500 bg-white p-5 text-center hover:bg-brand-50">
                {card}
              </Link>
            ) : (
              <div key={g} className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-5 text-center" aria-disabled>
                {card}
              </div>
            );
          })}
        </div>
      </Container>
    </>
  );
}
