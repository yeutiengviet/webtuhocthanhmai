"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

const field = "mt-1 block w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 focus:border-brand-500";

/** Đặt mật khẩu mới: dùng cho cả link "Quên mật khẩu" trong email (?code=…) và người đã đăng nhập muốn đổi. */
export function ChangePasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "ok" | "no">("checking");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowser();
      const code = new URL(window.location.href).searchParams.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState(null, "", "/doi-mat-khau");
      }
      const { data } = await supabase.auth.getSession();
      setReady(data.session ? "ok" : "no");
    })().catch(() => setReady("no"));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (password.length < 8) return setMsg({ ok: false, text: "Mật khẩu cần ít nhất 8 ký tự." });
    setBusy(true);
    try {
      const { error } = await createSupabaseBrowser().auth.updateUser({ password });
      if (error) return setMsg({ ok: false, text: /different|same/i.test(error.message) ? "Mật khẩu mới phải khác mật khẩu cũ." : "Chưa đổi được mật khẩu: " + error.message });
      setMsg({ ok: true, text: "Đã đổi mật khẩu. Đang chuyển về trang tài khoản…" });
      setTimeout(() => {
        router.push("/tai-khoan");
        router.refresh();
      }, 1200);
    } finally {
      setBusy(false);
    }
  }

  if (ready === "checking") return <p className="rounded-3xl bg-white p-6 font-bold text-gray-700 ring-1 ring-gray-100">Đang kiểm tra…</p>;
  if (ready === "no")
    return (
      <div className="rounded-3xl bg-white p-6 ring-1 ring-gray-100">
        <p className="font-bold text-gray-800">Link đặt lại mật khẩu đã hết hạn hoặc phụ huynh chưa đăng nhập.</p>
        <Link href="/dang-nhap" className="btn-toy mt-4 inline-block rounded-full bg-brand-600 px-6 py-3 font-extrabold text-white">Về trang đăng nhập</Link>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-brand-100">
      <label className="block font-extrabold text-gray-800">
        Mật khẩu mới <span className="font-semibold text-gray-500">(ít nhất 8 ký tự)</span>
        <input className={field} type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`rounded-2xl p-3 text-sm font-bold ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {msg.text}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-toy w-full rounded-full bg-brand-600 px-6 py-3 text-lg font-extrabold text-white disabled:opacity-60">
        {busy ? "Đang lưu…" : "Lưu mật khẩu mới"}
      </button>
    </form>
  );
}
