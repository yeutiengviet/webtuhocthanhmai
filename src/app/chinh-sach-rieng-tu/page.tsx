import { Container, PageHero } from "@/components/ui";

export const metadata = { title: "Chính sách quyền riêng tư" };

// BẢN NHÁP — cần người có chuyên môn pháp lý rà soát trước khi mở bán.
export default function PrivacyPage() {
  return (
    <>
      <PageHero title="Chính sách quyền riêng tư" subtitle="Bản nháp — chưa có hiệu lực." />
      <Container className="max-w-3xl space-y-4 py-8 text-gray-800">
        <p className="rounded-xl bg-accent-50 p-3 text-sm text-accent-700">Văn bản này là bản nháp để chủ dự án rà soát cùng người có chuyên môn pháp lý.</p>
        <h2 className="text-lg font-bold">1. Thông tin chúng tôi thu thập</h2>
        <p>Email (hoặc số điện thoại) của phụ huynh để đăng nhập; tên gọi và lớp của học sinh; điểm và lịch sử làm bài; lịch sử thanh toán (số tiền, nội dung chuyển khoản). Chúng tôi không thu thập số thẻ hay mật khẩu ngân hàng.</p>
        <h2 className="text-lg font-bold">2. Mục đích sử dụng</h2>
        <p>Cung cấp bài học, chấm điểm, cho phụ huynh theo dõi tiến độ, xác nhận thanh toán và hỗ trợ.</p>
        <h2 className="text-lg font-bold">3. Chia sẻ thông tin</h2>
        <p>Không bán hay chia sẻ thông tin cho bên thứ ba vì mục đích quảng cáo. Dữ liệu được lưu tại nhà cung cấp hạ tầng (máy chủ, cơ sở dữ liệu) theo hợp đồng dịch vụ của họ.</p>
        <h2 className="text-lg font-bold">4. Quyền của phụ huynh</h2>
        <p>Phụ huynh có thể yêu cầu xem, sửa hoặc xóa thông tin của mình và của con bằng cách liên hệ hotline/Zalo.</p>
        <h2 className="text-lg font-bold">5. Trẻ em</h2>
        <p>Tài khoản do phụ huynh tạo và quản lý; học sinh học dưới tài khoản của phụ huynh.</p>
      </Container>
    </>
  );
}
