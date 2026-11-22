import "server-only";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

// Private durable storage in PostgreSQL; file bytes are returned only by the authenticated API route.
export const MAX_FILE = 5 * 1024 * 1024;
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const DOC_MIME = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword", DOCX]);
export const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Detect the real file type from its first bytes, instead of trusting the browser. */
function sniff(buf: Buffer): string | null {
  if (buf.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  if (buf.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) return "zip";
  if (buf.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) return "application/msword";
  return null;
}

export class FileError extends Error {
  name = "FileError";
}

/** Validate size + real type without saving (use before any database writes). */
export async function assertFile(file: File, allowed: Set<string> = DOC_MIME) {
  if (file.size > MAX_FILE) throw new FileError(`${file.name}: file must be under 5 MB.`);
  const kind = sniff(Buffer.from(await file.slice(0, 16).arrayBuffer()));
  const mime = kind === "zip" ? (file.type === DOCX ? DOCX : null) : kind;
  if (!mime || !allowed.has(mime)) throw new FileError(`${file.name}: unsupported file type. Use PDF, JPG or PNG.`);
}

export async function saveFile(
  file: File,
  opts: { ownerType: string; ownerId?: string | null; uploadedBy?: string | null; allowed?: Set<string> },
) {
  const allowed = opts.allowed ?? DOC_MIME;
  if (file.size > MAX_FILE) throw new FileError("File must be under 5 MB.");
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniff(buf);
  const mime = kind === "zip" ? (file.type === DOCX ? DOCX : null) : kind;
  if (!mime || !allowed.has(mime)) throw new FileError("Unsupported file type. Use PDF, JPG or PNG.");
  const key = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}`;
  const db = await getDb();
  const [row] = await db
    .insert(schema.files)
    .values({
      storageKey: key,
      content: buf,
      filename: file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "file",
      mime,
      size: file.size,
      ownerType: opts.ownerType,
      ownerId: opts.ownerId ?? null,
      uploadedBy: opts.uploadedBy ?? null,
    })
    .returning({ id: schema.files.id });
  return row.id;
}

export async function readStoredFile(storageKey: string) {
  const db = await getDb();
  const [row] = await db.select({ content: schema.files.content }).from(schema.files).where(eq(schema.files.storageKey, storageKey)).limit(1);
  if (!row?.content) throw new Error("Stored file is unavailable");
  return Buffer.from(row.content);
}

export const fileFrom = (v: FormDataEntryValue | null) => (v instanceof File && v.size > 0 ? v : null);
