import Link from "next/link";
import { MathArt, VietArt } from "@/components/art";
import { Container, PageHero } from "@/components/ui";
import { SUBJECTS } from "@/lib/content";
import { countPublishedExams } from "@/lib/exams";

export const metadata = { title: "Đề thi" };
// Lưu sẵn trang, tự làm mới mỗi 60 giây; quản trị thêm/sửa/xóa đề thì làm mới ngay (revalidatePath).
export const revalidate = 60;

export default async function ExamsHome() {
  const counts = await countPublishedExams();
  return (
    <>
      <PageHero badge="⏱ Đề thi" title="Đề thi" subtitle="Đề kiểm tra giữa kì, cuối kì, đánh giá tháng và luyện thi — chọn môn để xem đề theo từng lớp." />
      <Container className="grid gap-4 py-8 sm:grid-cols-2">
        {SUBJECTS.map((s) => {
          const isMath = s.slug === "toan";
          const n = counts?.[s.slug] ?? 0;
          return (
            <Link
              key={s.slug}
              href={`/de-thi/${s.slug}`}
              className={`card-lift flex items-center gap-4 rounded-[2rem] p-6 text-white shadow-lg ${isMath ? "bg-gradient-to-br from-brand-600 to-brand-700" : "bg-gradient-to-br from-accent-600 to-accent-700"}`}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-display text-3xl font-extrabold">Đề thi {s.name}</span>
                <span className="mt-1 block font-semibold">{n > 0 ? `${n} đề` : "Đang cập nhật"} · lớp 1–5</span>
                <span className={`mt-3 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-extrabold ${isMath ? "text-brand-700" : "text-accent-700"}`}>Xem đề →</span>
              </span>
              {isMath ? <MathArt className="h-24 w-24 shrink-0" /> : <VietArt className="h-24 w-24 shrink-0" />}
            </Link>
          );
        })}
      </Container>
    </>
  );
}
