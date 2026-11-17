import Link from "next/link";
import { notFound } from "next/navigation";
import { ExamForm } from "@/components/admin/ExamForm";
import { NotAdmin } from "@/components/admin/NotAdmin";
import { Container, PageHero } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { isUuid } from "@/lib/exam-meta";
import { EXAM_COLUMNS, toExam, type ExamRow } from "@/lib/exams";

export const metadata = { title: "Sửa đề" };

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, isAdmin } = await requireAdminPage();
  if (!isAdmin) return <NotAdmin email={user?.email} />;
  if (!isUuid(id)) notFound();
  const { data } = await supabase.from("exams").select(EXAM_COLUMNS).eq("id", id).maybeSingle();
  if (!data) notFound();
  const e = toExam(data as ExamRow);
  // Cột thời gian áp dụng (migration 0007) đọc riêng: chưa chạy migration thì vẫn mở được trang sửa.
  const { data: r } = await supabase.from("exams").select("ap_dung_tu, ap_dung_den").eq("id", id).maybeSingle();
  return (
    <>
      <PageHero badge="Trang quản trị" title="Sửa đề" subtitle={e.title} />
      <Container className="max-w-2xl py-8">
        <Link href="/quan-tri" className="mb-4 inline-block py-2 font-extrabold text-brand-700 underline">← Danh sách đề</Link>
        <ExamForm
          initial={{
            id: e.id,
            subject: e.subject,
            grade: e.grade,
            category: e.category,
            title: e.title,
            durationMinutes: e.durationMinutes,
            isFree: e.isFree,
            published: e.published,
            hasHtml: e.hasFile && e.fileKind === "html",
            hasPdf: e.hasPdf || (e.hasFile && e.fileKind === "pdf"),
            externalUrl: e.externalUrl,
            apDungTu: (r?.ap_dung_tu as string | null) ?? null,
            apDungDen: (r?.ap_dung_den as string | null) ?? null,
          }}
        />
      </Container>
    </>
  );
}
