import { LoginForm } from "@/components/admin/LoginForm";
import { Container, PageHero } from "@/components/ui";

export const metadata = { title: "Đăng nhập", robots: { index: false, follow: false } };

// Nút "Đăng nhập" trên menu dẫn tới đây. Giai đoạn này dùng cho cô Thanh Mai (quản trị);
// Giai đoạn 3 sẽ dùng chung cho phụ huynh (tài khoản mới mặc định là phụ huynh, không có quyền quản trị).
export default function LoginPage() {
  return (
    <>
      <PageHero badge="Tài khoản" title="Đăng nhập" subtitle="Đăng nhập hoặc tạo tài khoản mới bằng email." />
      <Container className="max-w-md py-8">
        <LoginForm />
      </Container>
    </>
  );
}
