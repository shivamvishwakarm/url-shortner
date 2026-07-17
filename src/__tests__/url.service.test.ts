import { describe, expect, mock, test } from "bun:test"
import { CACHE_TTL_SECONDS } from "../constants/url"
import {
  createUrlService,
  type UrlCache,
  type UrlRepository,
} from "../service/url.service"
import { AppError } from "../utils/AppError"

const createCache = (): UrlCache & {
  get: ReturnType<typeof mock>
  set: ReturnType<typeof mock>
} => ({
  get: mock(async () => null),
  set: mock(async () => undefined),
})

const createRepository = (
  overrides: Partial<UrlRepository> = {},
): UrlRepository & {
  findByOriginalUrl: ReturnType<typeof mock>
  findByShortCode: ReturnType<typeof mock>
  create: ReturnType<typeof mock>
} => ({
  findByOriginalUrl: mock(async () => null),
  findByShortCode: mock(async () => null),
  create: mock(async ({ originalUrl, shortCode }) => ({
    originalUrl,
    shortCode,
  })),
  ...overrides,
})

describe("createUrlService", () => {
  test("returns existing short URL and refreshes cache", async () => {
    const repository = createRepository({
      findByOriginalUrl: mock(async () => ({
        originalUrl: "https://example.com/",
        shortCode: "abc12345",
      })),
    })
    const cache = createCache()
    const service = createUrlService({
      repository,
      cache,
      baseUrl: "https://sho.rt",
    })

    const result = await service.shorten("https://example.com")

    expect(result).toEqual({
      originalUrl: "https://example.com/",
      shortCode: "abc12345",
      shortUrl: "https://sho.rt/abc12345",
    })
    expect(repository.create).not.toHaveBeenCalled()
    expect(cache.set).toHaveBeenCalledWith(
      "abc12345",
      "https://example.com/",
      CACHE_TTL_SECONDS,
    )
  })

  test("creates custom alias when alias is available", async () => {
    const repository = createRepository()
    const cache = createCache()
    const service = createUrlService({
      repository,
      cache,
      baseUrl: "https://sho.rt/",
    })

    const result = await service.shorten("https://example.com/path", "custom_1")

    expect(result).toEqual({
      originalUrl: "https://example.com/path",
      shortCode: "custom_1",
      shortUrl: "https://sho.rt/custom_1",
    })
    expect(repository.create).toHaveBeenCalledWith({
      originalUrl: "https://example.com/path",
      shortCode: "custom_1",
      isCustomAlias: true,
    })
    expect(repository.findByOriginalUrl).not.toHaveBeenCalled()
    expect(cache.set).toHaveBeenCalledWith(
      "custom_1",
      "https://example.com/path",
      CACHE_TTL_SECONDS,
    )
  })

  test("rejects duplicate custom alias", async () => {
    const repository = createRepository({
      findByShortCode: mock(async () => ({
        originalUrl: "https://example.com/",
        shortCode: "custom_1",
      })),
    })
    const service = createUrlService({
      repository,
      cache: createCache(),
      baseUrl: "https://sho.rt",
    })

    await expect(
      service.shorten("https://example.com", "custom_1"),
    ).rejects.toMatchObject({
      message: "alias is already in use",
      statusCode: 409,
    })
  })

  test("creates generated short code for new URL", async () => {
    const repository = createRepository()
    const cache = createCache()
    const service = createUrlService({
      repository,
      cache,
      baseUrl: "https://sho.rt",
    })

    const result = await service.shorten("https://example.com/new")

    expect(result.shortCode).toHaveLength(8)
    expect(result.shortUrl).toBe(`https://sho.rt/${result.shortCode}`)
    expect(repository.create).toHaveBeenCalledWith({
      originalUrl: "https://example.com/new",
      shortCode: result.shortCode,
      isCustomAlias: false,
    })
  })

  test("fails when generated code collides repeatedly", async () => {
    const repository = createRepository({
      findByShortCode: mock(async () => ({
        originalUrl: "https://taken.example/",
        shortCode: "taken123",
      })),
    })
    const service = createUrlService({
      repository,
      cache: createCache(),
      baseUrl: "https://sho.rt",
    })

    await expect(service.shorten("https://example.com")).rejects.toMatchObject({
      message: "could not generate short code",
      statusCode: 500,
    })
  })

  test("resolves from cache before repository", async () => {
    const repository = createRepository()
    const cache = createCache()
    cache.get.mockImplementation(async () => "https://cached.example/")
    const service = createUrlService({
      repository,
      cache,
      baseUrl: "https://sho.rt",
    })

    await expect(service.resolve("abc12345")).resolves.toBe(
      "https://cached.example/",
    )
    expect(repository.findByShortCode).not.toHaveBeenCalled()
  })

  test("resolves from repository and stores cache miss", async () => {
    const repository = createRepository({
      findByShortCode: mock(async () => ({
        originalUrl: "https://example.com/",
        shortCode: "abc12345",
      })),
    })
    const cache = createCache()
    const service = createUrlService({
      repository,
      cache,
      baseUrl: "https://sho.rt",
    })

    await expect(service.resolve("abc12345")).resolves.toBe(
      "https://example.com/",
    )
    expect(cache.set).toHaveBeenCalledWith(
      "abc12345",
      "https://example.com/",
      CACHE_TTL_SECONDS,
    )
  })

  test("throws operational error when short URL is missing", async () => {
    const service = createUrlService({
      repository: createRepository(),
      cache: createCache(),
      baseUrl: "https://sho.rt",
    })

    await expect(service.resolve("missing1")).rejects.toBeInstanceOf(AppError)
    await expect(service.resolve("missing1")).rejects.toMatchObject({
      message: "short url not found",
      statusCode: 404,
    })
  })
})
