// Đăng nhập bằng SỐ ĐIỆN THOẠI mà không cần gửi tin nhắn SMS:
// số điện thoại được đổi thành một "email nội bộ" (vd 0912345678@sdt.hocgioithanhmai.com) để dùng cơ chế email + mật khẩu của Supabase.
// Website KHÔNG bao giờ gửi thư tới địa chỉ này (dự án đã tắt xác nhận email; "Quên mật khẩu" bị chặn cho tài khoản số điện thoại).
// File thuần — dùng được ở trình duyệt và máy chủ, có kiểm thử đơn vị.

export const PHONE_EMAIL_DOMAIN = "sdt.hocgioithanhmai.com";

/** Chuẩn hóa số điện thoại Việt Nam: bỏ khoảng trắng/dấu; +84/84 → 0. Trả null nếu không phải số hợp lệ (10–11 chữ số, bắt đầu bằng 0). */
export function normalizePhone(input: string): string | null {
  let d = input.trim().replace(/[\s.\-()]/g, "");
  if (d.startsWith("+84")) d = "0" + d.slice(3);
  else if (/^84\d{9,10}$/.test(d)) d = "0" + d.slice(2);
  return /^0\d{9,10}$/.test(d) ? d : null;
}

export type LoginId = { kind: "phone"; phone: string; email: string } | { kind: "email"; email: string };

/** Ô "Số điện thoại hoặc email" → email dùng để đăng nhập Supabase. null = nhập chưa đúng. */
export function parseLoginId(input: string): LoginId | null {
  const v = input.trim();
  if (v.includes("@")) {
    const email = v.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.endsWith("@" + PHONE_EMAIL_DOMAIN)) return null;
    return { kind: "email", email };
  }
  const phone = normalizePhone(v);
  return phone ? { kind: "phone", phone, email: `${phone}@${PHONE_EMAIL_DOMAIN}` } : null;
}

/** Tài khoản tạo bằng số điện thoại → trả số điện thoại; tài khoản email → null. */
export function phoneFromAccountEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const m = new RegExp(`^(0\\d{9,10})@${PHONE_EMAIL_DOMAIN.replace(/\./g, "\\.")}$`, "i").exec(email);
  return m ? m[1] : null;
}
