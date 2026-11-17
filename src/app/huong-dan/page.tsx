import { Container, PageHero } from "@/components/ui";

export const metadata = { title: "Hướng dẫn" };

export default function GuidePage() {
  return (
    <>
      <PageHero title="Hướng dẫn học" />
      <Container className="max-w-3xl py-8">
        <ol className="space-y-4">
          {[
            ["Chọn môn và lớp", "Bấm Toán ở menu, chọn lớp của con, rồi chọn “Học theo tuần”."],
            ["Mở đúng tuần", "Bấm “Đến tuần hiện tại” để mở tuần đang học trên lớp."],
            ["Xem video bài giảng", "Con xem video, có thể dừng và xem lại nhiều lần."],
            ["Làm phiếu luyện tập", "Làm phiếu cơ bản trước, phiếu nâng cao sau. Phiếu chấm điểm ngay."],
            ["Làm đề kiểm tra", "Tuần học cuối cùng của mỗi tháng có đề kiểm tra cuối tháng (vd cuối tháng 9, cuối tháng 10…); tuần ôn tập có đề cương và bộ đề."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 font-bold text-white">{i + 1}</span>
              <span>
                <span className="block font-semibold">{t}</span>
                <span className="text-gray-700">{d}</span>
              </span>
            </li>
          ))}
        </ol>
      </Container>
    </>
  );
}
