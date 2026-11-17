"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/data/site";
import { parseLoginId } from "@/lib/account-id";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

// Đăng nhập / tạo tài khoản MIỄN PHÍ cho phụ huynh (trang /dang-nhap).
// Tài khoản mới luôn là "phụ huynh" (bảng profiles, mặc định role = 'parent') — không bao giờ có quyền quản trị.
// Phụ huynh đăng nhập bằng SỐ ĐIỆN THOẠI hoặc EMAIL (không gửi SMS — xem src/lib/account-id.ts).
// Họ tên, số điện thoại, lớp của con lưu trong thông tin tài khoản (user_metadata) để cô xem trong Supabase.

const field = "mt-1 block w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 focus:border-brand-500";

type Mode = "login" | "signup" | "forgot";

/** Chỉ cho chuyển tới đường dẫn nội bộ (chống chuyển hướng sang trang lạ). */
function safeNext(next: string | null | undefined): string | null {
  return next && /^\/(?!\/)[a-z0-9\-/]*$/i.test(next) ? next : null;
}

export function ParentAuthForm({ initialMode = "login", next, linkError = false }: { initialMode?: Mode; next?: string; linkError?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(
    linkError ? { ok: false, text: "Link xác nhận đã hết hạn hoặc đã dùng. Phụ huynh thử đăng nhập; nếu chưa được, tạo lại tài khoản." } : null,
  );

  // Bấm link xác nhận trong email → quay về đây kèm ?code=… → đăng nhập luôn.
  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get("code");
    if (!code) return;
    (async () => {
      const { error } = await createSupabaseBrowser().auth.exchangeCodeForSession(code);
      if (error) {
        setMsg({ ok: true, text: "Email đã được xác nhận. Phụ huynh đăng nhập bằng email và mật khẩu vừa tạo." });
        window.history.replaceState(null, "", "/dang-nhap");
        return;
      }
      router.replace("/tai-khoan?moi=1");
      router.refresh();
    })();
  }, [router]);

  async function goAfterLogin(userId: string) {
    const supabase = createSupabaseBrowser();
    const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    router.push(data?.role === "admin" ? "/quan-tri" : safeNext(next) ?? "/tai-khoan");
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const id = parseLoginId(account);
    if (!id) return setMsg({ ok: false, text: "Phụ huynh nhập số điện thoại (vd 0912345678) hoặc email cho đúng nhé." });
    const mail = id.email;
    const contact = site.zalo ?? site.hotline;
    if (mode !== "forgot" && password.length < 8) return setMsg({ ok: false, text: "Mật khẩu cần ít nhất 8 ký tự." });
    if (mode === "signup" && fullName.trim().length < 2) return setMsg({ ok: false, text: "Phụ huynh nhập họ tên giúp cô nhé." });
    setBusy(true);
    try {
      const supabase = createSupabaseBrowser();
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email: mail, password });
        if (error || !data.user) {
          setMsg({ ok: false, text: error && /confirm/i.test(error.message) ? "Email chưa được xác nhận. Phụ huynh mở hộp thư (cả mục Thư rác/Spam) và bấm link xác nhận trước." : id.kind === "phone" ? "Sai số điện thoại hoặc mật khẩu." : "Sai email hoặc mật khẩu." });
          return;
        }
        await goAfterLogin(data.user.id);
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: mail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dang-nhap`,
            data: { full_name: fullName.trim().slice(0, 120), phone: id.kind === "phone" ? id.phone : phone.trim().slice(0, 20), grade: grade || null },
          },
        });
        const who = id.kind === "phone" ? "Số điện thoại" : "Email";
        if (error) {
          const t = /rate|limit/i.test(error.message)
            ? "Website đang bận. Phụ huynh đợi ít phút rồi thử lại, hoặc nhắn Zalo cho cô."
            : /registered|exists/i.test(error.message)
              ? `${who} này đã có tài khoản. Phụ huynh chuyển sang Đăng nhập.`
              : id.kind === "phone"
                ? `Chưa tạo được tài khoản bằng số điện thoại. Phụ huynh thử lại bằng email, hoặc nhắn Zalo cho cô${contact ? ` (${contact})` : ""}.`
                : "Chưa tạo được tài khoản: " + error.message;
          return setMsg({ ok: false, text: t });
        }
        if (data.session && data.user) {
          // Dự án không bắt xác nhận email → đăng nhập luôn.
          router.push("/tai-khoan?moi=1");
          router.refresh();
          return;
        }
        // Email đã có tài khoản: Supabase trả về người dùng không có danh tính (không gửi email).
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          setMsg({ ok: false, text: `${who} này đã có tài khoản. Phụ huynh chuyển sang Đăng nhập.` });
          return;
        }
        setMsg({ ok: true, text: `Đã tạo tài khoản! Phụ huynh mở hộp thư ${mail} (xem cả mục Thư rác/Spam), bấm link xác nhận là vào học được.` });
        setMode("login");
      } else {
        if (id.kind === "phone") {
          setMsg({ ok: false, text: `Tài khoản bằng số điện thoại: phụ huynh nhắn Zalo cho cô${contact ? ` (${contact})` : ""} để được đặt lại mật khẩu.` });
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: `${window.location.origin}/doi-mat-khau` });
        if (error) return setMsg({ ok: false, text: /rate|limit/i.test(error.message) ? "Gửi quá nhiều lần, phụ huynh đợi ít phút rồi thử lại." : "Chưa gửi được email: " + error.message });
        setMsg({ ok: true, text: `Nếu ${mail} đã có tài khoản, website vừa gửi email đặt lại mật khẩu. Phụ huynh mở email và bấm link.` });
      }
    } catch {
      setMsg({ ok: false, text: "Mất kết nối. Phụ huynh kiểm tra mạng rồi thử lại." });
    } finally {
      setBusy(false);
    }
  }

  const accountField = (
    <label className="block font-extrabold text-gray-800">
      Số điện thoại hoặc email
      <input
        className={field}
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        placeholder="vd 0912345678"
        value={account}
        onChange={(e) => setAccount(e.target.value)}
      />
      {mode === "signup" && <span className="mt-1 block text-sm font-semibold text-gray-600">Dùng số điện thoại cũng được — không cần mã xác nhận.</span>}
    </label>
  );

  const switchTo = (m: Mode) => {
    setMode(m);
    setMsg(null);
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-brand-100">
      {mode !== "forgot" ? (
        <div className="flex gap-2" role="tablist" aria-label="Chọn">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchTo(m)}
              className={`min-h-11 flex-1 rounded-full px-3 py-2 font-extrabold ring-2 ${mode === m ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-brand-700 ring-brand-200"}`}
            >
              {m === "login" ? "Đăng nhập" : "Tạo tài khoản"}
            </button>
          ))}
        </div>
      ) : (
        <h2 className="text-xl font-extrabold text-gray-900">Quên mật khẩu</h2>
      )}

      {mode === "signup" && (
        <>
          <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900 ring-1 ring-emerald-200">
            <span aria-hidden>🎁</span> Tài khoản miễn phí — tạo bằng số điện thoại hoặc email, mở toàn bộ bài giảng, phiếu luyện tập và đề ôn tập hè.
          </p>
          <label className="block font-extrabold text-gray-800">
            Họ tên phụ huynh
            <input className={field} type="text" autoComplete="name" required maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>
          {accountField}
          {account.includes("@") && (
            <label className="block font-extrabold text-gray-800">
              Số điện thoại / Zalo <span className="font-semibold text-gray-500">(không bắt buộc)</span>
              <input className={field} type="tel" autoComplete="tel" inputMode="tel" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
          )}
          <label className="block font-extrabold text-gray-800">
            Con đang học lớp <span className="font-semibold text-gray-500">(không bắt buộc)</span>
            <select className={field} value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">— Chọn lớp —</option>
              {[1, 2, 3, 4, 5].map((g) => (
                <option key={g} value={String(g)}>Lớp {g}</option>
              ))}
            </select>
          </label>
        </>
      )}

      {mode !== "signup" && accountField}

      {mode !== "forgot" && (
        <label className="block font-extrabold text-gray-800">
          Mật khẩu {mode === "signup" && <span className="font-semibold text-gray-500">(ít nhất 8 ký tự)</span>}
          <span className="relative block">
            <input
              className={`${field} pr-20`}
              type={showPw ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 min-h-11 -translate-y-1/2 px-2 text-sm font-bold text-brand-700">
              {showPw ? "Ẩn" : "Hiện"}
            </button>
          </span>
        </label>
      )}

      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`rounded-2xl p-3 text-sm font-bold ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {msg.text}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-toy w-full rounded-full bg-brand-600 px-6 py-3 text-lg font-extrabold text-white disabled:opacity-60">
        {busy ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : mode === "signup" ? "Tạo tài khoản miễn phí" : "Gửi email đặt lại mật khẩu"}
      </button>

      <p className="text-center text-sm font-semibold">
        {mode === "login" ? (
          <button type="button" onClick={() => switchTo("forgot")} className="min-h-11 text-brand-700 underline">Quên mật khẩu?</button>
        ) : mode === "forgot" ? (
          <button type="button" onClick={() => switchTo("login")} className="min-h-11 text-brand-700 underline">← Quay lại đăng nhập</button>
        ) : (
          <span className="text-gray-600">Bằng việc tạo tài khoản, phụ huynh đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư.</span>
        )}
      </p>
    </form>
  );
}
