// DANH SÁCH ĐỀ THI (khu "Đề thi").
// Giai đoạn 2: chuyển vào cơ sở dữ liệu, cô Thanh Mai tự tải đề lên từ trang quản trị.
// Chỉ ghi đề CÓ THẬT do cô cung cấp. url = null nghĩa là đã có đề nhưng chưa có link đặt phiếu.

import "server-only";
import type { Exam } from "@/lib/types";

const base = { type: "test" as const, videoProvider: null, videoRef: null, level: "co-ban" as const };

export const EXAMS: Exam[] = [
  {
    ...base,
    id: "de-t4-danh-gia-thang-10",
    slug: "danh-gia-nang-luc-thang-10",
    subject: "toan",
    grade: 4,
    category: "danh-gia-thang",
    title: "Toán lớp 4 – Đánh giá năng lực tháng 10",
    order: 1,
    isFree: true,
    url: "https://toantieuhoccothanhmai.github.io/lop4/toan-lop4-danh-gia-thang-10.html",
  },
  {
    ...base,
    id: "de-tv5-giua-ki-1-de-1",
    slug: "giua-ki-1-de-1-bai-ca-ve-trai-dat",
    subject: "tieng-viet",
    grade: 5,
    category: "giua-ki-1",
    title: "Đề 1: Bài ca về Trái Đất – Giữa học kì 1 Tiếng Việt 5",
    order: 1,
    isFree: true,
    url: null, // Chưa có link đặt phiếu — chờ cô gửi link hoặc tải lên ở Giai đoạn 2
  },
];
