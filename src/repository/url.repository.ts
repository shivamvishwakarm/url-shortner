import { Pool } from "pg"
import type { UrlRepository } from "../service/url.service"

type UrlRow = {
  short_code: string
  original_url: string
}

const toUrlRecord = (row: UrlRow) => ({
  shortCode: row.short_code,
  originalUrl: row.original_url,
})

export const createUrlRepository = (connectionString: string): UrlRepository => {
  const pool = new Pool({ connectionString })

  const findByOriginalUrl = async (originalUrl: string) => {
    const result = await pool.query<UrlRow>(
      `
        SELECT short_code, original_url
        FROM url_shortener
        WHERE original_url = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [originalUrl],
    )

    return result.rows[0] ? toUrlRecord(result.rows[0]) : null
  }

  const findByShortCode = async (shortCode: string) => {
    const result = await pool.query<UrlRow>(
      `
        SELECT short_code, original_url
        FROM url_shortener
        WHERE short_code = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [shortCode],
    )

    return result.rows[0] ? toUrlRecord(result.rows[0]) : null
  }

  const create: UrlRepository["create"] = async ({
    originalUrl,
    shortCode,
    isCustomAlias,
  }) => {
    const result = await pool.query<UrlRow>(
      `
        INSERT INTO url_shortener (
          original_url,
          short_code,
          is_custom_alias,
          updated_at
        )
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING short_code, original_url
      `,
      [originalUrl, shortCode, isCustomAlias],
    )

    return toUrlRecord(result.rows[0])
  }

  return {
    findByOriginalUrl,
    findByShortCode,
    create,
  }
}
