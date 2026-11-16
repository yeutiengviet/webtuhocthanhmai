import Link from "next/link";
import { ParentAuthForm } from "@/components/ParentAuthForm";
import { Container, PageHero } from "@/components/ui";

export const metadata = { title: "Đăng nhập", robots: { index: false, follow: false } };

// Đăng nhập / tạo tài khoản MIỄN PHÍ cho phụ huynh. Tài khoản quản trị đăng nhập ở đây cũng được (tự chuyển tới /quan-tri).
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ tab?: string; next?: string; error_description?: string }> }) {
  const { tab, next, error_description } = await searchParams;
  const signup = tab === "dang-ky";
  return (
    <>
      <PageHero
        badge="Tài khoản phụ huynh · Miễn phí"
        title={signup ? "Tạo tài khoản" : "Đăng nhập"}
        subtitle="Phụ huynh tạo tài khoản miễn phí bằng số điện thoại hoặc email để con học toàn bộ bài giảng, phiếu luyện tập và đề ôn tập hè."
      />
      <Container className="max-w-md py-8">
        <ParentAuthForm initialMode={signup ? "signup" : "login"} next={typeof next === "string" ? next : undefined} linkError={Boolean(error_description)} />
        <p className="mt-4 text-center text-sm text-gray-600">
          Xem <Link href="/dieu-khoan" className="font-bold text-brand-700 underline">Điều khoản sử dụng</Link> và{" "}
          <Link href="/chinh-sach-rieng-tu" className="font-bold text-brand-700 underline">Chính sách quyền riêng tư</Link>.
        </p>
      </Container>
    </>
  );
}
