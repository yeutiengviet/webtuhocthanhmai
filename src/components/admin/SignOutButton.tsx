"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/app/quan-tri/actions";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/quan-tri/dang-nhap");
        router.refresh();
      }}
      className="min-h-11 rounded-full bg-white px-5 font-extrabold text-brand-700 ring-2 ring-brand-200"
    >
      Đăng xuất
    </button>
  );
}
