import type { UrlCache } from "../service/url.service"

type CacheEntry = {
  originalUrl: string
  expiresAt?: number
}

export const createMemoryCache = (): UrlCache => {
  const entries = new Map<string, CacheEntry>()

  const get = async (shortCode: string) => {
    const entry = entries.get(shortCode)

    if (!entry) {
      return null
    }

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      entries.delete(shortCode)
      return null
    }

    return entry.originalUrl
  }

  const set = async (
    shortCode: string,
    originalUrl: string,
    ttlSeconds?: number,
  ) => {
    entries.set(shortCode, {
      originalUrl,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    })
  }

  return {
    get,
    set,
  }
}
