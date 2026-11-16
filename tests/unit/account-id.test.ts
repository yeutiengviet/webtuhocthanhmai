import { describe, expect, it } from "vitest";
import { normalizePhone, parseLoginId, phoneFromAccountEmail, PHONE_EMAIL_DOMAIN } from "@/lib/account-id";

describe("đăng nhập bằng số điện thoại hoặc email", () => {
  it("chuẩn hóa số điện thoại Việt Nam", () => {
    expect(normalizePhone("0912 345 678")).toBe("0912345678");
    expect(normalizePhone("+84 912.345.678")).toBe("0912345678");
    expect(normalizePhone("84912345678")).toBe("0912345678");
    expect(normalizePhone("09722299941")).toBe("09722299941");
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
  });
  it("số điện thoại → email nội bộ; email giữ nguyên (chữ thường)", () => {
    expect(parseLoginId(" 0912-345-678 ")).toEqual({ kind: "phone", phone: "0912345678", email: `0912345678@${PHONE_EMAIL_DOMAIN}` });
    expect(parseLoginId("Me@Gmail.com")).toEqual({ kind: "email", email: "me@gmail.com" });
    expect(parseLoginId("abc")).toBeNull();
    // không cho gõ thẳng email nội bộ
    expect(parseLoginId(`0912345678@${PHONE_EMAIL_DOMAIN}`)).toBeNull();
  });
  it("nhận ra tài khoản số điện thoại từ email nội bộ", () => {
    expect(phoneFromAccountEmail(`0912345678@${PHONE_EMAIL_DOMAIN}`)).toBe("0912345678");
    expect(phoneFromAccountEmail("me@gmail.com")).toBeNull();
    expect(phoneFromAccountEmail(null)).toBeNull();
  });
});
