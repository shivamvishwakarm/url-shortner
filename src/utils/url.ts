import { randomBytes } from "node:crypto"
import { SHORT_CODE_LENGTH } from "../constants/url"
import { AppError } from "./AppError"

export const normalizeUrl = (value: string) => {
  const url = new URL(value)

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError("url must be a valid http/https URL", 400)
  }

  return url.href
}

export const buildShortUrl = (baseUrl: string, shortCode: string) =>
  new URL(shortCode, `${baseUrl.replace(/\/+$/, "")}/`).href

export const generateShortCode = () =>
  randomBytes(6).toString("base64url").slice(0, SHORT_CODE_LENGTH)
