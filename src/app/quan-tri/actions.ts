"use server";

import { revalidatePath } from "next/cache";
import { courseHref, findItemById, itemAcceptsFiles } from "@/lib/content";
import {
  checkFileContent,
  imageExtFromBytes,
  isImageExt,
  isItemId,
  isUuid,
  MAX_FILE_BYTES,
  MAX_IMAGES,
  slugify,
  storagePath,
  validateExamInput,
  type FileKind,
  type StorageFolder,
} from "@/lib/exam-meta";
import { imagePathsOf, LESSON_FILE_COLUMNS, type LessonFileRow } from "@/lib/lesson-files";
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
async function verifyUploadedFile(
  supabase: Awaited<ReturnType<typeof getAdmin>>["supabase"],
  fileId: unknown,
  kind: FileKind,
  folder: StorageFolder = "exams",
): Promise<{ path: string; kind: FileKind } | { error: string }> {
  if (!isUuid(fileId)) return { error: "Thông tin file không hợp lệ." };
  const path = storagePath(fileId, kind, folder);
  const { data: blob, error } = await supabase.storage.from(STORAGE_BUCKET).download(path);
  if (error || !blob) return { error: "Không tìm thấy file vừa tải lên. Cô thử tải lại." };
  const problem = checkFileContent(new Uint8Array(await blob.arrayBuffer()), kind);
  if (problem) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    return { error: problem };
  }
  return { path, kind };
}

/** Kiểm tra cả 2 file (nếu có). Lỗi ở file nào thì báo rõ file đó. */
async function verifyPair(supabase: Awaited<ReturnType<typeof getAdmin>>["supabase"], input: Record<string, unknown>, folder: StorageFolder) {
  const html = input.htmlFileId ? await verifyUploadedFile(supabase, input.htmlFileId, "html", folder) : null;
  if (html && "error" in html) return { error: `Phiếu tương tác: ${html.error}` };
  const pdf = input.pdfFileId ? await verifyUploadedFile(supabase, input.pdfFileId, "pdf", folder) : null;
  if (pdf && "error" in pdf) return { error: `Phiếu PDF: ${pdf.error}` };
  return { html: html as { path: string } | null, pdf: pdf as { path: string } | null };
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
  if (!input.htmlFileId && !input.pdfFileId) return { ok: false, message: "Cô chọn ít nhất một file: phiếu tương tác hoặc phiếu PDF." };
  const files = await verifyPair(ctx.supabase, input, "exams");
  if ("error" in files) return { ok: false, message: files.error! };
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
    file_path: files.html?.path ?? null,
    file_kind: files.html ? "html" : null,
    pdf_path: files.pdf?.path ?? null,
  });
  if (error) return { ok: false, message: "Chưa lưu được đề. Cô thử lại sau ít phút." };
  revalidateExamPages();
  return { ok: true, message: `Đã tải đề “${v.data.title}” lên.`, href: `/de-thi/${v.data.subject}/lop-${v.data.grade}/${slug}` };
}

export async function updateExam(id: string, input: Record<string, unknown>): Promise<ActionResult> {
  const { ctx, err } = await adminOrError();
  if (!ctx) return err!;
  if (!isUuid(id)) return { ok: false, message: "Mã đề không hợp lệ." };
  const v = validateExamInput(input);
  if (!v.ok) return { ok: false, message: "Cô kiểm tra lại các ô được đánh dấu.", errors: v.errors };
  const { data: current } = await ctx.supabase.from("exams").select("file_path, file_kind, pdf_path").eq("id", id).maybeSingle();
  if (!current) return { ok: false, message: "Không tìm thấy đề." };
  const files = await verifyPair(ctx.supabase, input, "exams");
  if ("error" in files) return { ok: false, message: files.error! };

  const patch: Record<string, unknown> = {
    subject: v.data.subject,
    grade: v.data.grade,
    category: v.data.category,
    title: v.data.title,
    duration_minutes: v.data.durationMinutes,
    is_free: v.data.isFree,
    published: v.data.published,
  };
  const oldFiles: string[] = [];
  const clearMain = () => {
    patch.file_path = null;
    patch.file_kind = null;
    if (current.file_path) oldFiles.push(current.file_path);
  };
  // Phiếu tương tác (ô chính)
  if (files.html) {
    clearMain();
    patch.file_path = files.html.path;
    patch.file_kind = "html";
    patch.external_url = null;
  } else if (input.removeHtml === true && current.file_kind === "html") clearMain();
  // Phiếu PDF. Đề cũ chỉ có 1 file PDF ở ô chính: khi thay/xóa PDF thì bỏ luôn file đó.
  const legacyPdf = current.file_kind === "pdf" && !files.html;
  if (files.pdf || input.removePdf === true) {
    patch.pdf_path = files.pdf?.path ?? null;
    if (current.pdf_path) oldFiles.push(current.pdf_path);
    if (legacyPdf) clearMain();
  }
  patch.slug = await uniqueSlug(ctx.supabase, v.data.subject, v.data.grade, slugify(v.data.title), id);
  const { error } = await ctx.supabase.from("exams").update(patch).eq("id", id);
  if (error) return { ok: false, message: "Chưa lưu được thay đổi. Cô thử lại sau ít phút." };
  if (oldFiles.length) await ctx.supabase.storage.from(STORAGE_BUCKET).remove(oldFiles);
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
  const { data: current } = await ctx.supabase.from("exams").select("file_path, pdf_path, title").eq("id", id).maybeSingle();
  if (!current) return { ok: false, message: "Không tìm thấy đề." };
  const { error } = await ctx.supabase.from("exams").delete().eq("id", id);
  if (error) return { ok: false, message: "Chưa xóa được. Cô thử lại." };
  const old = [current.file_path, current.pdf_path].filter((p): p is string => Boolean(p));
  if (old.length) await ctx.supabase.storage.from(STORAGE_BUCKET).remove(old);
  revalidateExamPages();
  return { ok: true, message: `Đã xóa đề “${current.title}”.` };
}

/** Xóa file đã tải lên kho nhưng chưa gắn vào đề / bài nào (khi cô hủy giữa chừng hoặc lưu bị lỗi). */
export async function discardUpload(fileId: string, kind: string, folder: string = "exams"): Promise<void> {
  const { ctx } = await adminOrError();
  if (!ctx || !isUuid(fileId) || (kind !== "html" && kind !== "pdf" && !isImageExt(kind)) || (folder !== "exams" && folder !== "lessons")) return;
  const path = storagePath(fileId, kind, folder);
  if (isImageExt(kind)) {
    if (folder !== "lessons") return;
    const { data: l, error } = await ctx.supabase.from("lesson_files").select("item_id").contains("image_paths", [path]).limit(1);
    if (!error && !l?.length) await ctx.supabase.storage.from(STORAGE_BUCKET).remove([path]);
    return;
  }
  const [{ data: e }, { data: l }] = await Promise.all([
    ctx.supabase.from("exams").select("id").or(`file_path.eq.${path},pdf_path.eq.${path}`).limit(1),
    ctx.supabase.from("lesson_files").select("item_id").or(`html_path.eq.${path},pdf_path.eq.${path}`).limit(1),
  ]);
  if (!e?.length && !l?.length) await ctx.supabase.storage.from(STORAGE_BUCKET).remove([path]);
}

/** Kiểm tra ảnh vừa tải lên kho: tồn tại, đúng là ảnh JPG/PNG/WEBP theo NỘI DUNG. Sai thì xóa khỏi kho. */
async function verifyUploadedImage(
  supabase: Awaited<ReturnType<typeof getAdmin>>["supabase"],
  fileId: unknown,
  ext: unknown,
): Promise<{ path: string } | { error: string }> {
  if (!isUuid(fileId) || !isImageExt(ext)) return { error: "Thông tin ảnh không hợp lệ." };
  const path = storagePath(fileId, ext, "lessons");
  const { data: blob, error } = await supabase.storage.from(STORAGE_BUCKET).download(path);
  if (error || !blob) return { error: "Không tìm thấy ảnh vừa tải lên. Cô thử tải lại." };
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_FILE_BYTES || imageExtFromBytes(bytes) !== ext) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    return { error: bytes.length > MAX_FILE_BYTES ? "Ảnh quá lớn (tối đa 10 MB)." : "File không phải ảnh JPG, PNG hoặc WEBP." };
  }
  return { path };
}

/**
 * Danh sách ảnh mới của mục, theo thứ tự cô sắp: { keep: số thứ tự ảnh cũ (từ 0) } hoặc { fileId, ext } (ảnh vừa tải lên).
 * Trả về đường dẫn ảnh theo thứ tự và các ảnh cũ bị bỏ (để xóa khỏi kho sau khi lưu).
 */
async function resolveImages(
  supabase: Awaited<ReturnType<typeof getAdmin>>["supabase"],
  list: unknown,
  current: string[],
): Promise<{ paths: string[]; removed: string[]; added: string[] } | { error: string; added: string[] }> {
  if (!Array.isArray(list)) return { paths: current, removed: [], added: [] };
  if (list.length > MAX_IMAGES) return { error: `Mỗi mục tối đa ${MAX_IMAGES} ảnh.`, added: [] };
  const paths: string[] = [];
  const added: string[] = [];
  for (const [i, e] of list.entries()) {
    const entry = (e ?? {}) as Record<string, unknown>;
    if (typeof entry.keep === "number") {
      const p = Number.isInteger(entry.keep) ? current[entry.keep] : undefined;
      if (!p || paths.includes(p)) return { error: "Danh sách ảnh không hợp lệ. Cô tải lại trang rồi thử lại.", added };
      paths.push(p);
    } else {
      const v = await verifyUploadedImage(supabase, entry.fileId, entry.ext);
      if ("error" in v) return { error: `Ảnh thứ ${i + 1}: ${v.error}`, added };
      paths.push(v.path);
      added.push(v.path);
    }
  }
  return { paths, removed: current.filter((p) => !paths.includes(p)), added };
}

/**
 * Lưu file phiếu cho một mục bài học theo tuần: phiếu tương tác (.html) và/hoặc phiếu PDF.
 * Xóa cả hai file → bỏ hẳn dòng của mục đó.
 */
export async function saveLessonFiles(itemId: string, input: Record<string, unknown>): Promise<ActionResult> {
  const { ctx, err } = await adminOrError();
  if (!ctx) return err!;
  if (!isItemId(itemId)) return { ok: false, message: "Mã bài không hợp lệ." };
  const found = findItemById(itemId);
  if (!found) return { ok: false, message: "Không tìm thấy bài này." };
  const accepts = itemAcceptsFiles(found.item);
  if (input.htmlFileId && !accepts.html) return { ok: false, message: "Mục này chỉ nhận file PDF." };
  if ((input.htmlFileId || input.pdfFileId) && !accepts.pdf) return { ok: false, message: "Mục này không nhận file." };

  if (input.images !== undefined && !accepts.images) return { ok: false, message: "Mục này không nhận ảnh." };

  const { data: currentRow } = await ctx.supabase.from("lesson_files").select(LESSON_FILE_COLUMNS).eq("item_id", itemId).maybeSingle();
  const current = currentRow as LessonFileRow | null;
  const files = await verifyPair(ctx.supabase, input, "lessons");
  if ("error" in files) return { ok: false, message: files.error! };

  const images = accepts.images ? await resolveImages(ctx.supabase, input.images, imagePathsOf(current)) : { paths: [], removed: [], added: [] };
  if ("error" in images) {
    if (images.added.length) await ctx.supabase.storage.from(STORAGE_BUCKET).remove(images.added);
    return { ok: false, message: images.error };
  }

  const oldFiles: string[] = [...images.removed];
  let htmlPath = current?.html_path ?? null;
  let pdfPath = current?.pdf_path ?? null;
  if (files.html || input.removeHtml === true) {
    if (htmlPath) oldFiles.push(htmlPath);
    htmlPath = files.html?.path ?? null;
  }
  if (files.pdf || input.removePdf === true) {
    if (pdfPath) oldFiles.push(pdfPath);
    pdfPath = files.pdf?.path ?? null;
  }
  const isFree = input.isFree === true;
  const published = input.published === true;

  const empty = !htmlPath && !pdfPath && images.paths.length === 0;
  let error;
  if (empty) {
    ({ error } = await ctx.supabase.from("lesson_files").delete().eq("item_id", itemId));
  } else {
    // Chỉ gửi cột image_paths với mục ảnh — mục phiếu vẫn lưu được khi cơ sở dữ liệu chưa chạy migration 0006.
    const row = { item_id: itemId, html_path: htmlPath, pdf_path: pdfPath, is_free: isFree, published, ...(accepts.images ? { image_paths: images.paths } : {}) };
    ({ error } = await ctx.supabase.from("lesson_files").upsert(row, { onConflict: "item_id" }));
  }
  if (error) {
    if (images.added.length) await ctx.supabase.storage.from(STORAGE_BUCKET).remove(images.added);
    return { ok: false, message: accepts.images ? "Chưa lưu được ảnh. Cô thử lại sau ít phút (nếu vẫn lỗi: cơ sở dữ liệu cần chạy bản cập nhật 0006)." : "Chưa lưu được. Cô thử lại sau ít phút." };
  }
  if (oldFiles.length) await ctx.supabase.storage.from(STORAGE_BUCKET).remove(oldFiles);
  revalidatePath(courseHref(found.course), "layout");
  revalidatePath("/quan-tri", "layout");
  return { ok: true, message: empty ? "Đã gỡ hết file của mục này." : accepts.images ? `Đã lưu ${images.paths.length} ảnh.` : "Đã lưu phiếu." };
}

export async function signOut(): Promise<void> {
  const ctx = await getAdmin();
  await ctx.supabase.auth.signOut();
}
