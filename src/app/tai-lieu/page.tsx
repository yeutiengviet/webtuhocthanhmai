import Link from "next/link";
import { Container, GRADE_THEME, PageHero } from "@/components/ui";
import { GRADES } from "@/lib/content";
import { documentsGradeHref } from "@/lib/document-meta";
import { listPublishedDocuments } from "@/lib/documents";

export const metadata = { title: "Tài liệu" };
// Lưu sẵn trang, tự làm mới mỗi 60 giây (lượt tải); quản trị thêm/sửa/xóa thì làm mới ngay (revalidatePath).
export const revalidate = 60;

export default async function DocumentsHome() {
  const { documents } = await listPublishedDocuments();
  return (
    <>
      <PageHero
        badge="📚 Tài liệu"
        title="Tài liệu theo lớp"
        subtitle="Mỗi lớp có Tài liệu Toán và Tài liệu Tiếng Việt (Đọc hiểu, Luyện từ và câu, Chính tả, Tập làm văn / Viết). Xem PDF ngay trên web, phụ huynh đăng nhập để tải về in."
      />
      <Container className="py-8">
        <h2 className="mb-4 text-2xl text-gray-900">Chọn lớp của con</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
          {GRADES.map((g) => {
            const t = GRADE_THEME[g];
            const list = documents.filter((d) => d.grade === g);
            const toan = list.filter((d) => d.subject === "toan").length;
            const tv = list.length - toan;
            return (
              <Link key={g} href={documentsGradeHref(g)} className={`card-lift relative overflow-hidden rounded-[2rem] bg-white p-5 text-center shadow-sm ring-2 ${t.ring}`}>
                <span aria-hidden className={`absolute -right-5 -top-5 h-16 w-16 rounded-full ${t.soft}`} />
                <span aria-hidden className="relative text-3xl">{t.emoji}</span>
                <p className="relative text-sm font-bold text-gray-600">Tài liệu</p>
                <p className={`relative font-display text-5xl font-extrabold leading-none ${t.text}`}>Lớp {g}</p>
                <p className="relative mt-2 text-xs font-bold text-gray-700">
                  Toán: {toan} · Tiếng Việt: {tv}
                </p>
                <p className={`relative mt-2 inline-block rounded-full px-3 py-1 text-xs font-extrabold ${t.bg} text-white`}>Xem tài liệu →</p>
              </Link>
            );
          })}
        </div>
      </Container>
    </>
  );
}
