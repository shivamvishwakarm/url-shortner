import { describe, expect, test } from "bun:test"
import { shortenBodySchema, shortIdParamSchema } from "../schema/url.schema"

describe("url schemas", () => {
  test("accepts and trims valid shorten body", () => {
    expect(
      shortenBodySchema.parse({
        url: " https://example.com ",
        alias: " abc_1234 ",
      }),
    ).toEqual({
      url: "https://example.com",
      alias: "abc_1234",
    })
  })

  test("rejects short alias", () => {
    expect(() =>
      shortenBodySchema.parse({
        url: "https://example.com",
        alias: "short",
      }),
    ).toThrow()
  })

  test("rejects alias with unsupported characters", () => {
    expect(() =>
      shortenBodySchema.parse({
        url: "https://example.com",
        alias: "bad.code",
      }),
    ).toThrow()
  })

  test("accepts valid short ID params", () => {
    expect(shortIdParamSchema.parse({ shortId: "abc_123-XYZ" })).toEqual({
      shortId: "abc_123-XYZ",
    })
  })

  test("rejects invalid short ID params", () => {
    expect(() => shortIdParamSchema.parse({ shortId: "bad!" })).toThrow()
  })
})
