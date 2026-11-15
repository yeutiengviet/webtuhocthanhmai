import Link from "next/link";
import { Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-16 text-center">
      <p className="text-5xl font-extrabold text-brand-700">404</p>
      <p className="mt-2 text-lg">Không tìm thấy trang này.</p>
      <Link href="/" className="mt-4 inline-block rounded-full bg-brand-600 px-5 py-2.5 font-semibold text-white">Về trang chủ</Link>
    </Container>
  );
}
