import { Container, PageHero } from "@/components/ui";
import { SignOutButton } from "@/components/admin/SignOutButton";

export function NotAdmin({ email }: { email: string | undefined }) {
  return (
    <>
      <PageHero badge="Trang quản trị" title="Tài khoản chưa có quyền quản trị" />
      <Container className="max-w-xl py-8">
        <div className="space-y-3 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-brand-100">
          <p className="text-gray-800">Cô đang đăng nhập bằng <strong>{email}</strong>, nhưng tài khoản này chưa được cấp quyền quản trị.</p>
          <p className="text-gray-800">Cô nhắn Claude “đã tạo tài khoản quản trị” để được cấp quyền (chỉ làm một lần), rồi tải lại trang này.</p>
          <SignOutButton />
        </div>
      </Container>
    </>
  );
}
