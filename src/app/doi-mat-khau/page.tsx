import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { Container, PageHero } from "@/components/ui";

export const metadata = { title: "Đổi mật khẩu", robots: { index: false, follow: false } };

export default function ChangePasswordPage() {
  return (
    <>
      <PageHero badge="Tài khoản phụ huynh" title="Đổi mật khẩu" subtitle="Nhập mật khẩu mới cho tài khoản." />
      <Container className="max-w-md py-8">
        <ChangePasswordForm />
      </Container>
    </>
  );
}
