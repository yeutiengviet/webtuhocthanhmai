import { Container, PageHero } from "@/components/ui";
import { site } from "@/data/site";

export const metadata = { title: "Điều khoản sử dụng" };

// BẢN NHÁP — cần người có chuyên môn pháp lý rà soát trước khi mở bán.
export default function TermsPage() {
  return (
    <>
      <PageHero title="Điều khoản sử dụng" subtitle="Bản nháp — chưa có hiệu lực." />
      <Container className="max-w-3xl space-y-4 py-8 text-gray-800">
        <p className="rounded-xl bg-accent-50 p-3 text-sm text-accent-700">Văn bản này là bản nháp để chủ dự án rà soát cùng người có chuyên môn pháp lý.</p>
        <h2 className="text-lg font-bold">1. Gói học</h2>
        <p>Gói học gắn với một học sinh, một môn và một lớp, có thời hạn tính theo tháng (tối thiểu 1 tháng). Gia hạn khi còn hạn sẽ được cộng dồn vào ngày hết hạn hiện tại.</p>
        <h2 className="text-lg font-bold">2. Thanh toán</h2>
        <p>Thanh toán bằng chuyển khoản ngân hàng với nội dung riêng do website cung cấp. Gói học được kích hoạt sau khi giáo viên xác nhận đã nhận tiền.</p>
        <h2 className="text-lg font-bold">3. Hoàn tiền</h2>
        <p>{site.refundPolicy}</p>
        <h2 className="text-lg font-bold">4. Bản quyền nội dung</h2>
        <p>Video, phiếu bài tập và tài liệu thuộc bản quyền của {site.name}. Không sao chép, chia sẻ tài khoản hoặc phát tán nội dung trả phí.</p>
      </Container>
    </>
  );
}
