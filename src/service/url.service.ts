import { randomBytes } from "node:crypto"
import { AppError } from "../utils/AppError"

type UrlRecord = {
  shortCode: string
  originalUrl: string
}

export type UrlRepository = {
  findByOriginalUrl(originalUrl: string): Promise<UrlRecord | null>
  findByShortCode(shortCode: string): Promise<UrlRecord | null>
  create(data: {
    originalUrl: string
    shortCode: string
    isCustomAlias: boolean
  }): Promise<UrlRecord>
}

export type UrlCache = {
  get(shortCode: string): Promise<string | null>
  set(shortCode: string, originalUrl: string, ttlSeconds?: number): Promise<void>
}

type UrlServiceDependencies = {
  repository: UrlRepository
  cache: UrlCache
  baseUrl: string
}

const SHORT_CODE_LENGTH = 8
const MAX_CODE_GENERATION_ATTEMPTS = 5
const CACHE_TTL_SECONDS = 60 * 60

const normalizeUrl = (value: string) => {
  const url = new URL(value)

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError("url must be a valid http/https URL", 400)
  }

  return url.href
}

const buildShortUrl = (baseUrl: string, shortCode: string) =>
  new URL(shortCode, `${baseUrl.replace(/\/+$/, "")}/`).href

const generateShortCode = () =>
  randomBytes(6).toString("base64url").slice(0, SHORT_CODE_LENGTH)

export const createUrlService = ({
  repository,
  cache,
  baseUrl,
}: UrlServiceDependencies) => {
  const shorten = async (originalUrl: string, alias?: string) => {
    const normalizedUrl = normalizeUrl(originalUrl)

    if (alias) {
      const existingAlias = await repository.findByShortCode(alias)

      if (existingAlias) {
        throw new AppError("alias is already in use", 409)
      }

      const url = await repository.create({
        originalUrl: normalizedUrl,
        shortCode: alias,
        isCustomAlias: true,
      })

      await cache.set(url.shortCode, url.originalUrl, CACHE_TTL_SECONDS)

      return {
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        shortUrl: buildShortUrl(baseUrl, url.shortCode),
      }
    }

    const existingUrl = await repository.findByOriginalUrl(normalizedUrl)

    if (existingUrl) {
      await cache.set(existingUrl.shortCode, existingUrl.originalUrl, CACHE_TTL_SECONDS)

      return {
        originalUrl: existingUrl.originalUrl,
        shortCode: existingUrl.shortCode,
        shortUrl: buildShortUrl(baseUrl, existingUrl.shortCode),
      }
    }

    for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
      const shortCode = generateShortCode()
      const conflict = await repository.findByShortCode(shortCode)

      if (conflict) {
        continue
      }

      const url = await repository.create({
        originalUrl: normalizedUrl,
        shortCode,
        isCustomAlias: false,
      })

      await cache.set(url.shortCode, url.originalUrl, CACHE_TTL_SECONDS)

      return {
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        shortUrl: buildShortUrl(baseUrl, url.shortCode),
      }
    }

    throw new AppError("could not generate short code", 500)
  }

  const resolve = async (shortCode: string) => {
    const cachedUrl = await cache.get(shortCode)

    if (cachedUrl) {
      return cachedUrl
    }

    const url = await repository.findByShortCode(shortCode)

    if (!url) {
      throw new AppError("short url not found", 404)
    }

    await cache.set(shortCode, url.originalUrl, CACHE_TTL_SECONDS)

    return url.originalUrl
  }

  return {
    shorten,
    resolve,
  }
}
