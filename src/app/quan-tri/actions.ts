"use server";

import { revalidatePath } from "next/cache";
import { checkFileContent, isUuid, slugify, storagePath, validateExamInput, type FileKind } from "@/lib/exam-meta";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import { getAdmin } from "@/lib/supabase/server";

// MỌI thao tác ở đây kiểm tra lại quyền quản trị ở máy chủ (không tin trình duyệt).
// Cơ sở dữ liệu còn có Row Level Security chặn thêm một lớp nữa.

export type ActionResult = { ok: true; message: string; href?: string } | { ok: false; message: string; errors?: Record<string, string> };

async function adminOrError() {
  const ctx = await getAdmin();
  if (!ctx.user || !ctx.isAdmin) return { ctx: null, err: { ok: false, message: "Cô cần đăng nhập bằng tài khoản quản trị." } as ActionResult };
  return { ctx, err: null };
}

async function uniqueSlug(supabase: Awaited<ReturnType<typeof getAdmin>>["supabase"], subject: string, grade: number, base: string, exceptId?: string) {
  const { data } = await supabase.from("exams").select("id, slug").eq("subject", subject).eq("grade", grade).like("slug", `${base}%`);
  const taken = new Set((data ?? []).filter((r) => r.id !== exceptId).map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 1000; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
  return `${base}-${Date.now()}`;
}

/** Kiểm tra file vừa tải lên kho: tồn tại, đúng loại theo NỘI DUNG. Sai thì xóa khỏi kho. */
async function verifyUploadedFile(supabase: Awaited<ReturnType<typeof getAdmin>>["supabase"], fileId: unknown, kind: unknown): Promise<{ path: string; kind: FileKind } | { error: string }> {
  if (!isUuid(fileId) || (kind !== "html" && kind !== "pdf")) return { error: "Thông tin file không hợp lệ." };
  const path = storagePath(fileId, kind);
  const { data: blob, error } = await supabase.storage.from(STORAGE_BUCKET).download(path);
  if (error || !blob) return { error: "Không tìm thấy file vừa tải lên. Cô thử tải lại." };
  const problem = checkFileContent(new Uint8Array(await blob.arrayBuffer()), kind);
  if (problem) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    return { error: problem };
  }
  return { path, kind };
}

function revalidateExamPages() {
  revalidatePath("/de-thi", "layout");
  revalidatePath("/quan-tri", "layout");
}

export async function createExam(input: Record<string, unknown>): Promise<ActionResult> {
  const { ctx, err } = await adminOrError();
  if (!ctx) return err!;
  const v = validateExamInput(input);
  if (!v.ok) return { ok: false, message: "Cô kiểm tra lại các ô được đánh dấu.", errors: v.errors };
  const file = await verifyUploadedFile(ctx.supabase, input.fileId, input.fileKind);
  if ("error" in file) return { ok: false, message: file.error };
  const slug = await uniqueSlug(ctx.supabase, v.data.subject, v.data.grade, slugify(v.data.title));
  const { error } = await ctx.supabase.from("exams").insert({
    subject: v.data.subject,
    grade: v.data.grade,
    category: v.data.category,
    title: v.data.title,
    slug,
    duration_minutes: v.data.durationMinutes,
    is_free: v.data.isFree,
    published: v.data.published,
    file_path: file.path,
    file_kind: file.kind,
  });
  if (error) {
    await ctx.supabase.storage.from(STORAGE_BUCKET).remove([file.path]);
    return { ok: false, message: "Chưa lưu được đề. Cô thử lại sau ít phút." };
  }
  revalidateExamPages();
  return { ok: true, message: `Đã tải đề “${v.data.title}” lên.`, href: `/de-thi/${v.data.subject}/lop-${v.data.grade}/${slug}` };
}

export async function updateExam(id: string, input: Record<string, unknown>): Promise<ActionResult> {
  const { ctx, err } = await adminOrError();
  if (!ctx) return err!;
  if (!isUuid(id)) return { ok: false, message: "Mã đề không hợp lệ." };
  const v = validateExamInput(input);
  if (!v.ok) return { ok: false, message: "Cô kiểm tra lại các ô được đánh dấu.", errors: v.errors };
  const { data: current } = await ctx.supabase.from("exams").select("file_path, external_url").eq("id", id).maybeSingle();
  if (!current) return { ok: false, message: "Không tìm thấy đề." };

  const patch: Record<string, unknown> = {
    subject: v.data.subject,
    grade: v.data.grade,
    category: v.data.category,
    title: v.data.title,
    duration_minutes: v.data.durationMinutes,
    is_free: v.data.isFree,
    published: v.data.published,
  };
  let replacedOld: string | null = null;
  if (input.fileId) {
    const file = await verifyUploadedFile(ctx.supabase, input.fileId, input.fileKind);
    if ("error" in file) return { ok: false, message: file.error };
    patch.file_path = file.path;
    patch.file_kind = file.kind;
    patch.external_url = null;
    replacedOld = current.file_path;
  }
  patch.slug = await uniqueSlug(ctx.supabase, v.data.subject, v.data.grade, slugify(v.data.title), id);
  const { error } = await ctx.supabase.from("exams").update(patch).eq("id", id);
  if (error) return { ok: false, message: "Chưa lưu được thay đổi. Cô thử lại sau ít phút." };
  if (replacedOld) await ctx.supabase.storage.from(STORAGE_BUCKET).remove([replacedOld]);
  revalidateExamPages();
  return { ok: true, message: "Đã lưu thay đổi." };
}

export async function setExamFlags(id: string, flags: { published?: boolean; isFree?: boolean }): Promise<ActionResult> {
  const { ctx, err } = await adminOrError();
  if (!ctx) return err!;
  if (!isUuid(id)) return { ok: false, message: "Mã đề không hợp lệ." };
  const patch: Record<string, boolean> = {};
  if (typeof flags.published === "boolean") patch.published = flags.published;
  if (typeof flags.isFree === "boolean") patch.is_free = flags.isFree;
  const { error } = await ctx.supabase.from("exams").update(patch).eq("id", id);
  if (error) return { ok: false, message: "Chưa đổi được. Cô thử lại." };
  revalidateExamPages();
  return { ok: true, message: "Đã cập nhật." };
}

export async function deleteExam(id: string): Promise<ActionResult> {
  const { ctx, err } = await adminOrError();
  if (!ctx) return err!;
  if (!isUuid(id)) return { ok: false, message: "Mã đề không hợp lệ." };
  const { data: current } = await ctx.supabase.from("exams").select("file_path, title").eq("id", id).maybeSingle();
  if (!current) return { ok: false, message: "Không tìm thấy đề." };
  const { error } = await ctx.supabase.from("exams").delete().eq("id", id);
  if (error) return { ok: false, message: "Chưa xóa được. Cô thử lại." };
  if (current.file_path) await ctx.supabase.storage.from(STORAGE_BUCKET).remove([current.file_path]);
  revalidateExamPages();
  return { ok: true, message: `Đã xóa đề “${current.title}”.` };
}

/** Xóa file đã tải lên kho nhưng chưa gắn vào đề nào (khi cô hủy giữa chừng). */
export async function discardUpload(fileId: string, kind: string): Promise<void> {
  const { ctx } = await adminOrError();
  if (!ctx || !isUuid(fileId) || (kind !== "html" && kind !== "pdf")) return;
  const path = storagePath(fileId, kind);
  const { data } = await ctx.supabase.from("exams").select("id").eq("file_path", path).maybeSingle();
  if (!data) await ctx.supabase.storage.from(STORAGE_BUCKET).remove([path]);
}

export async function signOut(): Promise<void> {
  const ctx = await getAdmin();
  await ctx.supabase.auth.signOut();
}
