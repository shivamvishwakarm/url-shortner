import { describe, expect, test } from "bun:test"
import { SHORT_CODE_LENGTH } from "../constants/url"
import { buildShortUrl, generateShortCode, normalizeUrl } from "../utils/url"

describe("url utils", () => {
  test("normalizes valid http URLs", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com/")
  })

  test("rejects unsupported URL protocols", () => {
    expect(() => normalizeUrl("ftp://example.com/file")).toThrow(
      "url must be a valid http/https URL",
    )
  })

  test("builds short URL with or without trailing slash in base URL", () => {
    expect(buildShortUrl("https://sho.rt", "abc12345")).toBe(
      "https://sho.rt/abc12345",
    )
    expect(buildShortUrl("https://sho.rt/", "abc12345")).toBe(
      "https://sho.rt/abc12345",
    )
  })

  test("generates URL-safe short codes", () => {
    const shortCode = generateShortCode()

    expect(shortCode).toHaveLength(SHORT_CODE_LENGTH)
    expect(shortCode).toMatch(/^[a-zA-Z0-9_-]+$/)
  })
})
