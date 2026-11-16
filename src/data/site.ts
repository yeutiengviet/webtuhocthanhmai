// Cấu hình chung của website. Sau này phần này sẽ sửa được trong trang quản trị.
// QUY TẮC: không bịa số liệu. Ô nào để `null` thì website tự ẩn.

export const site = {
  name: "Học giỏi cùng cô Thanh Mai",
  shortName: "Cô Thanh Mai",
  /** Tên miền đã được chủ dự án xác nhận (chưa mua). */
  domain: "hocgioithanhmai.com" as string | null,
  quote: "Mỗi ngày một bài nhỏ — cả năm vững vàng.",
  /** Số điện thoại/Zalo hiển thị. null = chưa cung cấp, sẽ ẩn. */
  hotline: null as string | null,
  zalo: null as string | null,
  /** Mã video YouTube giới thiệu. null = chưa có. */
  introVideoRef: null as string | null,
  /** Học sinh, phụ huynh… — chỉ điền số thật. */
  extraStats: [] as { label: string; value: string }[],
  /** BẢN NHÁP — chủ dự án sửa lại lời cam kết. */
  commitments: [
    { title: "Bám sát sách Kết nối tri thức", text: "Bài học theo đúng từng tuần trên lớp." },
    { title: "Cô giáo tự soạn, tự giảng", text: "Video và phiếu bài tập do cô Thanh Mai biên soạn." },
    { title: "Luyện tập có chấm điểm", text: "Phiếu tương tác chấm điểm ngay, con biết đúng sai." },
    { title: "Phụ huynh theo dõi được", text: "Xem điểm và số lần làm bài của con (sắp có)." },
  ],
  /** Phản hồi phụ huynh — chỉ đưa phản hồi thật, có sự đồng ý. Rỗng = ẩn mục. */
  testimonials: [] as { name: string; text: string }[],
  banners: [
    { title: "Toán lớp 4 theo tuần", text: "35 tuần bám sát sách Kết nối tri thức", href: "/toan/lop-4/theo-tuan" },
    { title: "Toán nâng cao theo chuyên đề", text: "Toán tư duy từ lớp 2 đến lớp 5", href: "/toan/lop-4/nang-cao" },
    { title: "Phiếu bài tập tương tác", text: "Làm thử Phiếu đánh giá tháng 10 – Toán lớp 4", href: "/toan/lop-4/theo-tuan/tuan-8/danh-gia-thang-10" },
  ],
  refundPolicy: "Không hoàn tiền sau khi gói học đã được kích hoạt.",
};
