import "server-only";
import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number, opts: crypto.ScryptOptions) => Promise<Buffer>;
const PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** Format: scrypt$N$r$p$salt$hash (base64) */
export async function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(pw.normalize("NFKC"), salt, 64, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(pw: string, stored: string | null | undefined) {
  if (!stored) {
    await scrypt("dummy", crypto.randomBytes(16), 64, PARAMS); // keep timing similar
    return false;
  }
  const [alg, N, r, p, s, h] = stored.split("$");
  if (alg !== "scrypt") return false;
  const expected = Buffer.from(h, "base64");
  const got = await scrypt(pw.normalize("NFKC"), Buffer.from(s, "base64"), expected.length, { N: +N, r: +r, p: +p, maxmem: PARAMS.maxmem });
  return crypto.timingSafeEqual(got, expected);
}

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("base64url");
export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
export const randomDigits = (n = 6) => String(crypto.randomInt(0, 10 ** n)).padStart(n, "0");

/** Readable temporary password, e.g. "Holard-7KQ4-M9TX" */
export function tempPassword() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = () => Array.from({ length: 4 }, () => a[crypto.randomInt(a.length)]).join("");
  return `Holard-${pick()}-${pick()}`;
}
