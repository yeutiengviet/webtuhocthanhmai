import { LoginForm } from "@/components/admin/LoginForm";
import { Container, PageHero } from "@/components/ui";

export const metadata = { title: "Đăng nhập quản trị" };

export default function AdminLoginPage() {
  return (
    <>
      <PageHero badge="Trang quản trị" title="Đăng nhập quản trị" subtitle="Dành cho cô Thanh Mai để tải đề, sửa nội dung." />
      <Container className="max-w-md py-8">
        <LoginForm />
      </Container>
    </>
  );
}
