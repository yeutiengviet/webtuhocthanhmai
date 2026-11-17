import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PdfDownloadButton, UploadedPdf } from "@/components/LessonMedia";
import { Breadcrumbs, Container, FreeBadge, ItemIcon, LockBadge } from "@/components/ui";
import { parseGradeSlug } from "@/lib/content";
import { docCategoryLabel, documentFileHref, documentHref, documentsGradeHref } from "@/lib/document-meta";
import { documentDecision } from "@/lib/download-access-server";
import { findPublishedDocument, listPublishedDocuments } from "@/lib/documents";
import { slugify } from "@/lib/exam-meta";

// Nút tải xanh/xám tùy quyền tải của người đang xem → BẮT BUỘC render động, không lưu đệm chung giữa người xem.
export const dynamic = "force-dynamic";

type Params = Promise<{ lop: string; id: string }>;

async function load(p: Awaited<Params>) {
  const grade = parseGradeSlug(p.lop);
  if (!grade) return null;
  const doc = await findPublishedDocument(grade, p.id);
  return doc ? { grade, doc } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const d = await load(await params);
  return { title: d ? d.doc.title : "Không tìm thấy trang" };
}

export default async function DocumentPage({ params }: { params: Params }) {
  const d = await load(await params);
  if (!d) notFound();
  const { grade, doc } = d;
  const subjectName = doc.subject === "toan" ? "Toán" : "Tiếng Việt";
  const group = docCategoryLabel(doc.subject, doc.category);
  const [list, dl] = await Promise.all([listPublishedDocuments(grade), documentDecision()]);
  const others = list.documents.filter((x) => x.id !== doc.id && x.subject === doc.subject && x.category === doc.category);
  const src = documentFileHref(doc.id);

  return (
    <Container className="py-5">
      <Breadcrumbs
        items={[
          { href: "/tai-lieu", label: "Tài liệu" },
          { href: documentsGradeHref(grade), label: `Lớp ${grade}` },
          { href: `${documentsGradeHref(grade)}#${doc.subject}`, label: subjectName },
        ]}
      />
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <article>
          <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-accent-50 via-brand-50 to-amber-50 p-5 ring-1 ring-accent-200 sm:p-7">
            <p className="text-sm font-bold text-accent-700">
              Tài liệu {subjectName} lớp {grade}
              {doc.subject === "tieng-viet" ? ` · ${group}` : ""}
            </p>
            <h1 className="mt-1 text-3xl text-gray-900 sm:text-4xl">{doc.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
              {doc.isFree ? <FreeBadge /> : <LockBadge />}
              <span className="text-gray-700">⬇️ {doc.downloads} lượt tải</span>
            </div>
            {doc.isFree && (
              <div className="no-print mt-5 flex flex-wrap gap-3">
                <PdfDownloadButton src={src} fileName={`${slugify(doc.title)}.pdf`} label="Tải tài liệu PDF" title={doc.title} viewHref="#xem-tai-lieu" decision={dl} />
              </div>
            )}
          </header>

          <section id="xem-tai-lieu" className="mt-6 scroll-mt-28">
            {doc.isFree ? (
              <UploadedPdf src={src} title={doc.title} />
            ) : (
              <div className="rounded-[2rem] border-2 border-dashed border-brand-300 bg-white p-8 text-center">
                <p className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-3xl" aria-hidden>🔒</p>
                <p className="mt-3 font-display text-2xl font-extrabold text-brand-700">Tài liệu này cô đang cập nhật</p>
                <Link href={documentsGradeHref(grade)} className="btn-toy mt-4 inline-block rounded-full bg-brand-600 px-6 py-3 font-extrabold text-white">Xem tài liệu khác</Link>
              </div>
            )}
          </section>
        </article>

        <aside className="no-print">
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-accent-100">
            <h2 className="text-xl text-gray-900">{doc.subject === "tieng-viet" ? group : `Tài liệu Toán lớp ${grade}`} – tài liệu khác</h2>
            {others.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">Cô đang cập nhật thêm tài liệu.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {others.map((x) => (
                  <li key={x.id}>
                    <Link href={documentHref(x)} className="flex items-center gap-2 rounded-2xl p-2 text-sm font-semibold hover:bg-accent-50">
                      <ItemIcon type="document" />
                      <span className="min-w-0 flex-1">{x.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href={documentsGradeHref(grade)} className="mt-2 inline-block py-2 text-sm font-extrabold text-brand-700 underline">Tất cả tài liệu lớp {grade}</Link>
          </div>
        </aside>
      </div>
    </Container>
  );
}
