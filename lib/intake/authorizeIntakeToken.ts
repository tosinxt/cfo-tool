import { timingSafeEqual, createHash } from "crypto";

/**
 * Constant-time comparison of a supplied intake token against the stored one.
 *
 * Hashing first gives both buffers a fixed equal length, so `timingSafeEqual`
 * never throws on a length mismatch and the comparison leaks nothing about
 * how much of the token was correct.
 */
export function intakeTokenMatches(
  storedToken: string | undefined | null,
  suppliedToken: string | undefined | null
): boolean {
  if (!suppliedToken) return false;
  const stored = Buffer.from(
    createHash("sha256").update(storedToken ?? "").digest("hex")
  );
  const supplied = Buffer.from(
    createHash("sha256").update(suppliedToken).digest("hex")
  );
  return stored.length === supplied.length && timingSafeEqual(stored, supplied);
}
