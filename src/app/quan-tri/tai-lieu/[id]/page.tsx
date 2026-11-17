import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentForm } from "@/components/admin/DocumentForm";
import { NotAdmin } from "@/components/admin/NotAdmin";
import { Container, PageHero } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { DOCUMENT_COLUMNS, toDocument, type DocumentRow } from "@/lib/documents";
import { isUuid } from "@/lib/exam-meta";

export const metadata = { title: "Sửa tài liệu" };

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, isAdmin } = await requireAdminPage();
  if (!isAdmin) return <NotAdmin email={user?.email} />;
  if (!isUuid(id)) notFound();
  const { data } = await supabase.from("documents").select(DOCUMENT_COLUMNS).eq("id", id).maybeSingle();
  if (!data) notFound();
  const d = toDocument(data as DocumentRow);
  return (
    <>
      <PageHero badge="Trang quản trị" title="Sửa tài liệu" subtitle={d.title} />
      <Container className="max-w-2xl py-8">
        <Link href="/quan-tri/tai-lieu" className="mb-4 inline-block py-2 font-extrabold text-brand-700 underline">← Danh sách tài liệu</Link>
        <DocumentForm initial={{ id: d.id, subject: d.subject, grade: d.grade, category: d.category, title: d.title, isFree: d.isFree, published: d.published }} />
      </Container>
    </>
  );
}
