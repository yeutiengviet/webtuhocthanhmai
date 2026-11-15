import { Container, PageHero } from "@/components/ui";
import { site } from "@/data/site";

export const metadata = { title: "Thanh toán" };

export default function PaymentGuidePage() {
  return (
    <>
      <PageHero title="Hướng dẫn nộp phí" subtitle="Chuyển khoản ngân hàng — cô xác nhận rồi mở bài cho con." />
      <Container className="max-w-3xl space-y-4 py-8">
        <div className="rounded-2xl border-2 border-accent-200 bg-accent-50 p-4 text-accent-700">
          <strong>Bản dùng thử:</strong> chức năng đăng ký gói và thanh toán chưa mở (Giai đoạn 3). Vui lòng chưa chuyển khoản.
        </div>
        <ol className="space-y-3">
          {[
            "Đăng ký tài khoản phụ huynh và thêm hồ sơ của con (tên, lớp).",
            "Chọn gói: môn + lớp + số tháng (tối thiểu 1 tháng).",
            "Website hiện số tài khoản, số tiền chính xác, nội dung chuyển khoản riêng của con và mã QR.",
            "Chuyển khoản đúng số tiền và đúng nội dung.",
            "Cô Thanh Mai kiểm tra tiền về và bấm xác nhận — bài học được mở ngay.",
            "Hết hạn gói, bài trả phí tự khóa; phụ huynh có thể gia hạn bất cứ lúc nào (cộng dồn thời gian còn lại).",
          ].map((t, i) => (
            <li key={i} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 font-bold text-white">{i + 1}</span>
              <span className="text-gray-800">{t}</span>
            </li>
          ))}
        </ol>
        <p className="rounded-2xl bg-white p-4 text-gray-800 shadow-sm"><strong>Chính sách hoàn tiền:</strong> {site.refundPolicy}</p>
      </Container>
    </>
  );
}
