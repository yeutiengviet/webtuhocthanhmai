"use client";
import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";

export function createSupabaseBrowser() {
  const env = supabaseEnv();
  if (!env) throw new Error("Chưa cấu hình Supabase");
  return createBrowserClient(env.url, env.key);
}
