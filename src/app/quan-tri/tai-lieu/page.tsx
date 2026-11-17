import Link from "next/link";
import { DocumentForm } from "@/components/admin/DocumentForm";
import { DocumentRowActions } from "@/components/admin/DocumentRowActions";
import { NotAdmin } from "@/components/admin/NotAdmin";
import { Container, FreeBadge, LockBadge, PageHero } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { GRADES } from "@/lib/content";
import { DOC_CATEGORIES, documentHref, sortDocuments } from "@/lib/document-meta";
import { DOCUMENT_COLUMNS, isMissingTable, toDocument, type DocumentRow } from "@/lib/documents";

export const metadata = { title: "Quản lý tài liệu" };

export default async function AdminDocumentsPage() {
  const { supabase, user, isAdmin } = await requireAdminPage();
  if (!isAdmin) return <NotAdmin email={user?.email} />;
  const { data, error } = await supabase.from("documents").select(DOCUMENT_COLUMNS);
  const missing = isMissingTable(error);
  const docs = sortDocuments(((data ?? []) as DocumentRow[]).map(toDocument));

  return (
    <>
      <PageHero badge="Trang quản trị" title="Tài liệu theo lớp" subtitle="Mỗi lớp 1–5: Tài liệu Toán và Tài liệu Tiếng Việt (Đọc hiểu, Luyện từ và câu, Chính tả, Tập làm văn / Viết)." />
      <Container className="max-w-3xl space-y-6 py-8">
        <Link href="/quan-tri" className="inline-block py-2 font-extrabold text-brand-700 underline">← Trang quản trị</Link>
        {missing ? (
          <p role="alert" className="rounded-2xl bg-amber-50 p-4 font-semibold text-amber-900 ring-1 ring-amber-200">
            Chưa bật mục Tài liệu trong cơ sở dữ liệu. Cần chạy file <code>supabase/migrations/0008_lop_1_va_tai_lieu.sql</code> trong Supabase → SQL Editor
            (hoặc nhắn Claude chạy giúp). Chạy xong tải lại trang này.
          </p>
        ) : error ? (
          <p role="alert" className="rounded-2xl bg-red-50 p-3 font-bold text-red-800">Chưa tải được danh sách tài liệu. Cô tải lại trang sau ít phút.</p>
        ) : null}

        <section aria-labelledby="tai-moi">
          <h2 id="tai-moi" className="mb-3 text-2xl text-gray-900"><span aria-hidden>📤</span> Tải tài liệu mới</h2>
          <DocumentForm />
        </section>

        <h2 className="text-2xl text-gray-900">Tất cả tài liệu ({docs.length})</h2>
        {GRADES.map((g) => {
          const byGrade = docs.filter((d) => d.grade === g);
          return (
            <details key={g} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-brand-100" open={byGrade.length > 0 && byGrade.length <= 30}>
              <summary className="cursor-pointer font-display text-xl font-extrabold text-gray-900">Lớp {g} ({byGrade.length})</summary>
              {(["toan", "tieng-viet"] as const).flatMap((s) =>
                DOC_CATEGORIES[s].map((c) => {
                  const list = byGrade.filter((d) => d.subject === s && d.category === c.slug);
                  return (
                    <div key={`${s}-${c.slug}`} className="mt-4">
                      <h3 className="text-base font-extrabold text-violet-800">
                        {s === "toan" ? "Toán" : `Tiếng Việt · ${c.label}`} ({list.length})
                      </h3>
                      {list.length === 0 ? (
                        <p className="text-sm text-gray-600">Chưa có tài liệu.</p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {list.map((d) => (
                            <li key={d.id} className="rounded-2xl bg-gray-50 p-3">
                              <p className="font-bold text-gray-900">{d.title}</p>
                              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold">
                                {d.isFree ? <FreeBadge /> : <LockBadge />}
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${d.published ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-gray-100 text-gray-700"}`}>
                                  {d.published ? "Đang hiện" : "Đang ẩn (nháp)"}
                                </span>
                                <span className="text-gray-700">⬇️ {d.downloads} lượt tải</span>
                                {d.published && <Link href={documentHref(d)} className="font-bold text-brand-700 underline">Xem trên website</Link>}
                              </p>
                              <DocumentRowActions id={d.id} title={d.title} published={d.published} isFree={d.isFree} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                }),
              )}
            </details>
          );
        })}
      </Container>
    </>
  );
}
