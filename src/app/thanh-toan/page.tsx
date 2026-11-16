import Link from "next/link";
import { Container, PageHero } from "@/components/ui";

export const metadata = { title: "Học phí" };

export default function PaymentGuidePage() {
  return (
    <>
      <PageHero title="Học phí" subtitle="Hiện tại toàn bộ bài học trên website đều miễn phí." />
      <Container className="max-w-3xl space-y-4 py-8">
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-900">
          <span aria-hidden>🎁</span> Phụ huynh <strong>không cần chuyển khoản</strong>. Chỉ cần tạo tài khoản miễn phí là con học được tất cả bài giảng, phiếu luyện tập và đề ôn tập hè.
        </div>
        <ol className="space-y-3">
          {[
            "Bấm “Tạo tài khoản miễn phí”, nhập họ tên phụ huynh, email và mật khẩu.",
            "Mở hộp thư email, bấm link xác nhận (nếu website gửi email xác nhận).",
            "Đăng nhập, chọn môn và lớp của con để bắt đầu học.",
          ].map((t, i) => (
            <li key={i} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 font-bold text-white">{i + 1}</span>
              <span className="text-gray-800">{t}</span>
            </li>
          ))}
        </ol>
        <Link href="/dang-nhap?tab=dang-ky" className="btn-toy inline-block rounded-full bg-brand-600 px-6 py-3 text-lg font-extrabold text-white">Tạo tài khoản miễn phí</Link>
        <p className="text-sm text-gray-600">Nếu sau này có gói học trả phí, cô sẽ thông báo trước cho phụ huynh.</p>
      </Container>
    </>
  );
}
