import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MathArt, VietArt } from "@/components/art";
import { SubjectDocuments } from "@/components/DocumentList";
import { Breadcrumbs, Container, PageHero } from "@/components/ui";
import { GRADES, gradeSlug, parseGradeSlug, SUBJECTS } from "@/lib/content";
import { documentsGradeHref } from "@/lib/document-meta";
import { listPublishedDocuments } from "@/lib/documents";

// Lưu sẵn trang, tự làm mới mỗi 60 giây (lượt tải); quản trị thêm/sửa/xóa thì làm mới ngay (revalidatePath).
export const revalidate = 60;

export function generateStaticParams() {
  return GRADES.map((g) => ({ lop: gradeSlug(g) }));
}

type Params = Promise<{ lop: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const g = parseGradeSlug((await params).lop);
  return { title: g ? `Tài liệu lớp ${g}` : "Không tìm thấy trang" };
}

export default async function DocumentsByGrade({ params }: { params: Params }) {
  const grade = parseGradeSlug((await params).lop);
  if (!grade) notFound();
  const { documents, error } = await listPublishedDocuments(grade);

  return (
    <>
      <PageHero badge="📚 Tài liệu" title={`Tài liệu lớp ${grade}`} subtitle={`${documents.length} tài liệu · Bấm vào tên tài liệu để xem PDF và tải về.`}>
        <div className="mb-2">
          <Breadcrumbs items={[{ href: "/tai-lieu", label: "Tài liệu" }, { label: `Lớp ${grade}` }]} />
        </div>
      </PageHero>
      <Container className="space-y-10 py-8">
        <nav aria-label="Chọn lớp" className="flex flex-wrap gap-2">
          {GRADES.map((g) => (
            <Link
              key={g}
              href={documentsGradeHref(g)}
              aria-current={g === grade ? "page" : undefined}
              className={`rounded-full px-5 py-2 font-extrabold ring-2 ${g === grade ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-brand-700 ring-brand-200"}`}
            >
              Lớp {g}
            </Link>
          ))}
        </nav>
        {error && (
          <p role="alert" className="rounded-3xl bg-amber-50 p-5 text-center font-semibold text-amber-900 ring-1 ring-amber-200">
            Chưa tải được danh sách tài liệu. Phụ huynh vui lòng tải lại trang sau ít phút.
          </p>
        )}
        {SUBJECTS.map((s) => {
          const isMath = s.slug === "toan";
          const n = documents.filter((d) => d.subject === s.slug).length;
          return (
            <section key={s.slug} id={s.slug} aria-labelledby={`mon-${s.slug}`} className="scroll-mt-28">
              <div className={`mb-4 flex items-center gap-3 rounded-[2rem] p-4 text-white shadow ${isMath ? "bg-gradient-to-br from-brand-600 to-brand-700" : "bg-gradient-to-br from-accent-600 to-accent-700"}`}>
                {isMath ? <MathArt className="h-14 w-14 shrink-0" /> : <VietArt className="h-14 w-14 shrink-0" />}
                <h2 id={`mon-${s.slug}`} className="text-2xl sm:text-3xl">
                  Tài liệu {s.name} lớp {grade} <span className="block text-base font-semibold sm:inline">({n} tài liệu)</span>
                </h2>
              </div>
              <SubjectDocuments subject={s.slug} documents={documents} />
            </section>
          );
        })}
      </Container>
    </>
  );
}
