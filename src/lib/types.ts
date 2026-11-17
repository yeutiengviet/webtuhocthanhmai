// Kiểu dữ liệu nội dung — đặt tên giống các bảng sẽ tạo trong Supabase ở Giai đoạn 2
// (subjects, courses, weeks, items) để chuyển sang cơ sở dữ liệu không phải sửa giao diện.

export type SubjectSlug = "toan" | "tieng-viet";

/** Các lớp của website (lớp 1–5). */
export type Grade = 1 | 2 | 3 | 4 | 5;

export interface Subject {
  slug: SubjectSlug;
  name: string;
  shortDescription: string;
}

/** Hướng học trong một lớp. Chỉ hiện ra giao diện khi có nội dung. */
export type Track = "theo-tuan" | "on-tap-he" | "nang-cao" | "ky-thi" | "tai-lieu";

export interface Course {
  id: string;
  subject: SubjectSlug;
  grade: Grade;
  track: Track;
  /** Luôn là Kết nối tri thức; giữ cột để mở rộng sau, giao diện không hiển thị lựa chọn. */
  textbook: "ket-noi-tri-thuc";
  title: string;
  /** Khung trống: đã có đủ tuần và ô nội dung, nhưng tên bài chưa được cập nhật. */
  isSkeleton?: boolean;
  weeks: Week[];
}

export type WeekKind = "hoc" | "on-tap-giua-ky" | "on-tap-cuoi-ky";

export interface Week {
  id: string;
  number: number;
  /** Đường dẫn riêng (khối ôn tập); mặc định `tuan-<số>`. */
  slug?: string;
  /** Nhãn hiển thị thay cho "Tuần N" (vd. "Ôn tập"). */
  label?: string;
  /** Ngày đầu/cuối tuần dạng YYYY-MM-DD (ngày lịch Việt Nam, không có giờ). */
  startDate: string;
  endDate: string;
  title: string;
  kind: WeekKind;
  /** Tuần ẩn sẽ không hiện cho học sinh (để soạn trước). */
  published: boolean;
  items: Item[];
}

/** "images": mục chỉ gồm ảnh cô tải lên (vd. sơ đồ tư duy nội dung tuần học, nhiều ảnh). */
export type ItemType = "video" | "worksheet" | "document" | "test" | "images";
export type Level = "co-ban" | "nang-cao";

export interface Item {
  id: string;
  /** Đoạn đường dẫn, duy nhất trong một tuần. */
  slug: string;
  type: ItemType;
  title: string;
  level: Level | null;
  order: number;
  isFree: boolean;
  /** Mục mở rộng/tư duy (tùy chọn). */
  isExtension?: boolean;
  videoProvider: "youtube" | null;
  videoRef: string | null;
  /** Đường dẫn phiếu/tài liệu (bản dùng thử: link ngoài; sau này: file trong kho riêng). */
  url: string | null;
  /** Thời gian làm bài (phút) với đề kiểm tra. */
  durationMinutes?: number;
}

/** Nhóm đề thi (khu "Đề thi"). */
export type ExamCategory =
  | "danh-gia-thang"
  | "on-tap-giua-ki-1"
  | "giua-ki-1"
  | "on-tap-cuoi-ki-1"
  | "cuoi-ki-1"
  | "on-tap-giua-ki-2"
  | "giua-ki-2"
  | "on-tap-cuoi-nam"
  | "cuoi-nam"
  | "luyen-thi";

/** Một đề thi trong khu "Đề thi" (bảng exams trong Supabase). */
export interface Exam {
  id: string;
  slug: string;
  subject: SubjectSlug;
  grade: Grade;
  category: ExamCategory;
  title: string;
  durationMinutes: number | null;
  isFree: boolean;
  published: boolean;
  /** Đề tải lên kho riêng tư: html (phiếu tương tác) hoặc pdf. */
  fileKind: "html" | "pdf" | null;
  hasFile: boolean;
  /** Có phiếu PDF riêng để tải về. */
  hasPdf: boolean;
  /** Đề đặt ở trang ngoài (vd github.io) — phải thuộc WORKSHEET_HOSTS. */
  externalUrl: string | null;
  sortOrder: number;
}
