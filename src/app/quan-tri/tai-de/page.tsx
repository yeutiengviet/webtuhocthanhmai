import Link from "next/link";
import { ExamForm } from "@/components/admin/ExamForm";
import { NotAdmin } from "@/components/admin/NotAdmin";
import { Container, PageHero } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";

export const metadata = { title: "Tải đề lên" };

export default async function UploadExamPage() {
  const { user, isAdmin } = await requireAdminPage();
  if (!isAdmin) return <NotAdmin email={user?.email} />;
  return (
    <>
      <PageHero badge="Trang quản trị" title="Tải đề lên" subtitle="Chọn môn, lớp, đặt tên đề và chọn file. Đề hiện ngay ở mục Đề thi." />
      <Container className="max-w-2xl py-8">
        <Link href="/quan-tri" className="mb-4 inline-block py-2 font-extrabold text-brand-700 underline">← Danh sách đề</Link>
        <ExamForm />
      </Container>
    </>
  );
}
