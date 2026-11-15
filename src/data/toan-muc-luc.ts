// MỤC LỤC TOÁN LỚP 2, 3, 5 (sách Kết nối tri thức với cuộc sống) và CHUYÊN ĐỀ TOÁN NÂNG CAO.
// BẢN NHÁP: tên bài được soạn theo mục lục sách nhưng CHƯA đối chiếu với sách/Mathx —
// chủ dự án cần rà lại tên bài và cách chia tuần (sửa trong file này rồi đẩy lên là web tự cập nhật).
// Danh sách theo thứ tự trong sách; web tự chia đều vào các tuần học (trừ tuần 9, 18, 27, 35 là tuần ôn tập).

export const LESSON_TITLES: Record<2 | 3 | 5, string[]> = {
  2: [
    "Ôn tập các số đến 100", "Tia số. Số liền trước, số liền sau", "Các thành phần của phép cộng, phép trừ",
    "Hơn, kém nhau bao nhiêu", "Ôn tập phép cộng, phép trừ (không nhớ) trong phạm vi 100", "Luyện tập chung",
    "Phép cộng (qua 10) trong phạm vi 20", "Bảng cộng (qua 10)", "Phép trừ (qua 10) trong phạm vi 20", "Bảng trừ (qua 10)",
    "Bài toán về thêm, bớt một số đơn vị", "Bài toán về nhiều hơn, ít hơn một số đơn vị",
    "Ôn tập phép cộng, phép trừ trong phạm vi 20", "Luyện tập chung", "Ki-lô-gam", "Lít", "Thực hành và trải nghiệm với ki-lô-gam, lít",
    "Phép cộng (có nhớ) số có hai chữ số với số có một chữ số", "Phép cộng (có nhớ) số có hai chữ số với số có hai chữ số",
    "Phép trừ (có nhớ) số có hai chữ số cho số có một chữ số", "Phép trừ (có nhớ) số có hai chữ số cho số có hai chữ số",
    "Điểm, đoạn thẳng, đường thẳng, đường cong, ba điểm thẳng hàng", "Đường gấp khúc. Hình tứ giác", "Thực hành vẽ đoạn thẳng",
    "Ngày, giờ", "Ngày, tháng", "Thực hành và trải nghiệm xem đồng hồ, xem lịch", "Ôn tập phép cộng, phép trừ", "Ôn tập hình học và đo lường",
    "Phép nhân", "Thừa số, tích", "Bảng nhân 2", "Bảng nhân 5", "Phép chia", "Số bị chia, số chia, thương", "Bảng chia 2", "Bảng chia 5",
    "Khối trụ, khối cầu", "Đơn vị, chục, trăm, nghìn", "Các số có ba chữ số", "So sánh các số có ba chữ số", "Luyện tập chung",
    "Đề-xi-mét. Mét. Ki-lô-mét", "Giới thiệu tiền Việt Nam", "Phép cộng (không nhớ, có nhớ) trong phạm vi 1000",
    "Phép trừ (không nhớ, có nhớ) trong phạm vi 1000", "Thu thập, phân loại, kiểm đếm", "Biểu đồ tranh", "Chắc chắn, có thể, không thể",
    "Ôn tập các số đến 1000", "Ôn tập phép tính trong phạm vi 1000", "Ôn tập hình học và đo lường", "Ôn tập chung",
  ],
  3: [
    "Ôn tập các số đến 1000", "Ôn tập các phép tính trong phạm vi 1000", "Tìm thành phần trong phép cộng, phép trừ",
    "Ôn tập biểu thức số", "Làm quen với biểu thức chứa chữ", "Luyện tập chung",
    "Bảng nhân 2, bảng nhân 5", "Bảng nhân 3, bảng nhân 4", "Bảng nhân 6", "Bảng nhân 7", "Bảng nhân 8", "Bảng nhân 9",
    "Bảng chia 2, bảng chia 5", "Bảng chia 3, bảng chia 4", "Bảng chia 6", "Bảng chia 7", "Bảng chia 8", "Bảng chia 9",
    "Một phần mấy", "Gấp một số lên một số lần", "Giảm một số đi một số lần", "Bài toán giải bằng hai bước tính", "Luyện tập chung",
    "Điểm ở giữa. Trung điểm của đoạn thẳng", "Hình tròn. Tâm, bán kính, đường kính", "Góc. Góc vuông, góc không vuông",
    "Thực hành vẽ góc vuông", "Hình chữ nhật. Hình vuông", "Khối lập phương. Khối hộp chữ nhật",
    "Nhân số có hai chữ số với số có một chữ số", "So sánh số lớn gấp mấy lần số bé", "Chia số có hai chữ số cho số có một chữ số",
    "Phép chia hết, phép chia có dư", "Biểu thức số. Tính giá trị của biểu thức số", "Luyện tập chung",
    "Mi-li-mét", "Gam", "Mi-li-lít", "Nhiệt độ", "Tiền Việt Nam", "Xem đồng hồ", "Tháng, năm",
    "Chu vi hình tam giác, hình tứ giác", "Chu vi hình chữ nhật, hình vuông", "Luyện tập chung",
    "Các số có bốn chữ số. Số 10 000", "So sánh các số trong phạm vi 10 000", "Làm tròn số đến hàng chục, hàng trăm",
    "Phép cộng, phép trừ trong phạm vi 10 000", "Nhân số có bốn chữ số với số có một chữ số", "Chia số có bốn chữ số cho số có một chữ số",
    "Các số trong phạm vi 100 000", "Diện tích của một hình. Xăng-ti-mét vuông", "Diện tích hình chữ nhật, hình vuông",
    "Thu thập, phân loại, ghi chép số liệu", "Bảng số liệu", "Khả năng xảy ra của một sự kiện",
    "Ôn tập các số đến 100 000", "Ôn tập phép tính", "Ôn tập hình học và đo lường", "Ôn tập thống kê và xác suất", "Ôn tập chung",
  ],
  5: [
    "Ôn tập số tự nhiên", "Ôn tập các phép tính với số tự nhiên", "Ôn tập phân số", "Ôn tập các phép tính với phân số",
    "Phân số thập phân", "Hỗn số", "Ôn tập hình học và đo lường", "Ôn tập một số yếu tố thống kê và xác suất", "Luyện tập chung",
    "Khái niệm số thập phân", "Hàng của số thập phân. Đọc, viết số thập phân", "So sánh các số thập phân",
    "Viết các số đo đại lượng dưới dạng số thập phân", "Làm tròn số thập phân", "Luyện tập chung",
    "Cộng các số thập phân", "Trừ các số thập phân", "Nhân số thập phân với số tự nhiên", "Nhân hai số thập phân",
    "Chia số thập phân cho số tự nhiên", "Chia một số tự nhiên cho một số thập phân", "Chia hai số thập phân",
    "Nhân, chia nhẩm với 10, 100, 1000 và 0,1, 0,01, 0,001", "Sử dụng máy tính cầm tay", "Luyện tập chung",
    "Tỉ số. Tỉ số phần trăm", "Tìm tỉ số phần trăm của hai số", "Tìm giá trị phần trăm của một số", "Tìm một số biết giá trị phần trăm của số đó",
    "Hình tam giác. Diện tích hình tam giác", "Hình thang. Diện tích hình thang", "Đường tròn. Chu vi hình tròn", "Diện tích hình tròn",
    "Hình hộp chữ nhật. Hình lập phương", "Diện tích xung quanh và diện tích toàn phần", "Xăng-ti-mét khối, đề-xi-mét khối, mét khối",
    "Thể tích hình hộp chữ nhật", "Thể tích hình lập phương", "Luyện tập chung",
    "Số đo thời gian", "Cộng, trừ số đo thời gian", "Nhân, chia số đo thời gian", "Vận tốc", "Quãng đường, thời gian", "Bài toán chuyển động",
    "Biểu đồ hình quạt tròn", "Tỉ lệ bản đồ", "Tỉ số của số lần xuất hiện", "Thực hành và trải nghiệm",
    "Ôn tập số thập phân", "Ôn tập các phép tính với số thập phân", "Ôn tập tỉ số phần trăm", "Ôn tập hình học", "Ôn tập đo lường",
    "Ôn tập thống kê và xác suất", "Ôn tập chung",
  ],
};

/** Chuyên đề Toán nâng cao (toán tư duy) theo lớp. */
export const NANG_CAO_TOPICS: Record<2 | 3 | 4 | 5, string[]> = {
  2: [
    "Dãy số theo quy luật", "Tìm số còn thiếu", "Cộng, trừ nhiều số – điền dấu", "Bài toán nhiều hơn, ít hơn", "Đếm hình",
    "Giờ, ngày, tháng – bài toán thời gian", "Cân và đong (ki-lô-gam, lít)", "Bài toán nhân, chia đơn giản", "Cấu tạo số có ba chữ số",
    "Toán vui – suy luận logic", "So sánh và sắp xếp số", "Ôn tập tổng hợp",
  ],
  3: [
    "Dãy số cách đều", "Tính nhanh", "Tìm x", "Gấp, giảm một số lần", "Bài toán rút về đơn vị", "Bài toán giải bằng hai bước tính",
    "Chu vi và diện tích", "Đếm hình", "Cấu tạo số", "Bài toán tuổi", "Suy luận logic", "Bài toán thực tế: thời gian, tiền Việt Nam", "Ôn tập tổng hợp",
  ],
  4: [
    "Dãy số theo quy luật", "Tính nhanh", "Số chẵn, số lẻ – tính chất chia hết", "Trung bình cộng", "Tìm hai số biết tổng và hiệu",
    "Tìm hai số biết tổng và tỉ", "Tìm hai số biết hiệu và tỉ", "Phân số – bài toán nâng cao", "Chu vi, diện tích hình chữ nhật, hình vuông",
    "Đếm hình", "Bài toán tuổi", "Giả thiết tạm", "Nguyên lí Dirichlet (chuồng và thỏ)", "Suy luận logic", "Ôn tập tổng hợp",
  ],
  5: [
    "Số thập phân – bài toán nâng cao", "Tính nhanh với số thập phân", "Tỉ số phần trăm – bài toán thực tế", "Trung bình cộng",
    "Tổng – tỉ, hiệu – tỉ", "Toán chuyển động", "Toán chuyển động ngược chiều, cùng chiều", "Bài toán năng suất, làm chung làm riêng",
    "Diện tích các hình phẳng", "Hình tròn và các hình ghép", "Thể tích, diện tích hình hộp chữ nhật, hình lập phương", "Dãy số theo quy luật",
    "Bài toán tuổi", "Giả thiết tạm", "Đếm hình", "Suy luận logic", "Ôn tập tổng hợp",
  ],
};

/** Chia đều danh sách bài vào các tuần học (giữ nguyên thứ tự); trả về mảng theo từng tuần, tuần ôn tập = []. */
export function distributeLessons(titles: string[], totalWeeks: number, reviewWeeks: Set<number>): string[][] {
  const teaching = Array.from({ length: totalWeeks }, (_, i) => i + 1).filter((n) => !reviewWeeks.has(n));
  const out: string[][] = Array.from({ length: totalWeeks }, () => []);
  teaching.forEach((n, k) => {
    const from = Math.floor((k * titles.length) / teaching.length);
    const to = Math.floor(((k + 1) * titles.length) / teaching.length);
    out[n - 1] = titles.slice(from, to);
  });
  return out;
}
