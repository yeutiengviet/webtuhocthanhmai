"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

const field = "mt-1 block w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 focus:border-brand-500";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (password.length < 8) return setMsg({ ok: false, text: "Mật khẩu cần ít nhất 8 ký tự." });
    setBusy(true);
    try {
      const supabase = createSupabaseBrowser();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          setMsg({ ok: false, text: /confirm/i.test(error.message) ? "Email chưa được xác nhận. Cô mở hộp thư và bấm link xác nhận trước." : "Sai email hoặc mật khẩu." });
          return;
        }
        router.push("/quan-tri");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/quan-tri/dang-nhap` },
        });
        if (error) return setMsg({ ok: false, text: /rate|limit/i.test(error.message) ? "Gửi quá nhiều lần, cô đợi ít phút rồi thử lại." : "Chưa tạo được tài khoản: " + error.message });
        setMsg({ ok: true, text: "Đã tạo tài khoản. Cô mở hộp thư email, bấm link xác nhận, rồi quay lại đây đăng nhập." });
        setMode("login");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-brand-100">
      <div className="flex gap-2" role="tablist" aria-label="Chọn">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full px-4 py-2 font-extrabold ring-2 ${mode === m ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-brand-700 ring-brand-200"}`}
          >
            {m === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        ))}
      </div>
      <label className="block font-extrabold text-gray-800">
        Email
        <input className={field} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block font-extrabold text-gray-800">
        Mật khẩu
        <input className={field} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`rounded-2xl p-3 text-sm font-bold ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {msg.text}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-toy w-full rounded-full bg-brand-600 px-6 py-3 text-lg font-extrabold text-white disabled:opacity-60">
        {busy ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
      </button>
      {mode === "signup" && (
        <p className="text-sm text-gray-600">Tài khoản mới chưa có quyền quản trị. Sau khi tạo, cô báo để cấp quyền (chỉ làm một lần).</p>
      )}
    </form>
  );
}
