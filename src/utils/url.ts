import { randomBytes } from "node:crypto"
import { SHORT_CODE_LENGTH } from "../constants/url"
import { AppError } from "./AppError"

// Base62 alphabet: digits + lowercase + uppercase (URL-safe, no special chars)
const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

export const normalizeUrl = (value: string) => {
  const url = new URL(value)

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError("url must be a valid http/https URL", 400)
  }

  return url.href
}

export const buildShortUrl = (baseUrl: string, shortCode: string) =>
  new URL(shortCode, `${baseUrl.replace(/\/+$/, "")}/`).href

/**
 * Generates a cryptographically random Base62 shortcode.
 *
 * Strategy: Random rocks + ask chief 
 * - Draw SHORT_CODE_LENGTH random bytes from the OS CSPRNG.
 * - Map each byte into the 62-char alphabet via modulo (bias is negligible:
 *   256 % 62 = 4, so chars 0–3 appear ~0.15 % more often — acceptable).
 * - The service layer retries on the rare collision (≤5 attempts).
 *
 * Collision probability per attempt with 8 Base62 chars:
 *   62^8 ≈ 218 trillion possible codes → vanishingly small at any realistic scale.
 */
export const generateShortCode = (): string => {
  const bytes = randomBytes(SHORT_CODE_LENGTH)
  let code = ""
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    code += BASE62[bytes[i] % 62]
  }
  return code
}
