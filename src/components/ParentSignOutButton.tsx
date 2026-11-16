"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export function ParentSignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await createSupabaseBrowser().auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="min-h-11 rounded-full bg-white px-5 font-extrabold text-brand-700 ring-2 ring-brand-200"
    >
      Đăng xuất
    </button>
  );
}
