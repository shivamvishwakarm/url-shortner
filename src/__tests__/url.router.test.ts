import { describe, expect, mock, test } from "bun:test"
import express from "express"
import { createUrlRouter } from "../Router/url.router"
import { errorHandler } from "../middleware/error.middleware"
import type { createUrlService } from "../service/url.service"
import { AppError } from "../utils/AppError"
import { request } from "./helpers/http"

type UrlService = ReturnType<typeof createUrlService>

const createApp = (urlService?: UrlService) => {
  const app = express()

  app.use(express.json())
  app.use(createUrlRouter({ urlService }))
  app.use(errorHandler)

  return app
}

const createAppWithLocals = (urlService: UrlService) => {
  const app = express()

  app.locals.urlService = urlService
  app.use(express.json())
  app.use(createUrlRouter())
  app.use(errorHandler)

  return app
}

describe("url router", () => {
  test("creates a short URL", async () => {
    const urlService = {
      shorten: mock(async () => ({
        originalUrl: "https://example.com/",
        shortCode: "abc12345",
        shortUrl: "https://sho.rt/abc12345",
      })),
      resolve: mock(async () => "https://example.com/"),
    }
    const response = await request(createApp(urlService), "/shorten", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://example.com" }),
    })

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      data: {
        originalUrl: "https://example.com/",
        shortCode: "abc12345",
        shortUrl: "https://sho.rt/abc12345",
      },
    })
    expect(urlService.shorten).toHaveBeenCalledWith(
      "https://example.com",
      undefined,
    )
  })

  test("passes custom alias to service", async () => {
    const urlService = {
      shorten: mock(async () => ({
        originalUrl: "https://example.com/",
        shortCode: "custom_1",
        shortUrl: "https://sho.rt/custom_1",
      })),
      resolve: mock(async () => "https://example.com/"),
    }

    const response = await request(createApp(urlService), "/shorten", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url: "https://example.com",
        alias: "custom_1",
      }),
    })

    expect(response.status).toBe(201)
    expect(urlService.shorten).toHaveBeenCalledWith(
      "https://example.com",
      "custom_1",
    )
  })

  test("rejects invalid shorten payload", async () => {
    const urlService = {
      shorten: mock(async () => ({
        originalUrl: "",
        shortCode: "",
        shortUrl: "",
      })),
      resolve: mock(async () => ""),
    }

    const response = await request(createApp(urlService), "/shorten", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "not-a-url" }),
    })

    expect(response.status).toBe(400)
    expect(urlService.shorten).not.toHaveBeenCalled()
  })

  test("redirects resolved short URL", async () => {
    const urlService = {
      shorten: mock(async () => ({
        originalUrl: "https://example.com/",
        shortCode: "abc12345",
        shortUrl: "https://sho.rt/abc12345",
      })),
      resolve: mock(async () => "https://example.com/"),
    }

    const response = await request(createApp(urlService), "/abc12345", {
      redirect: "manual",
    })

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe("https://example.com/")
    expect(urlService.resolve).toHaveBeenCalledWith("abc12345")
  })

  test("uses app locals service when dependency is not injected", async () => {
    const urlService = {
      shorten: mock(async () => ({
        originalUrl: "https://example.com/",
        shortCode: "abc12345",
        shortUrl: "https://sho.rt/abc12345",
      })),
      resolve: mock(async () => "https://example.com/"),
    }

    const response = await request(
      createAppWithLocals(urlService),
      "/abc12345",
      {
        redirect: "manual",
      },
    )

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe("https://example.com/")
    expect(urlService.resolve).toHaveBeenCalledWith("abc12345")
  })

  test("rejects invalid short ID params", async () => {
    const urlService = {
      shorten: mock(async () => ({
        originalUrl: "",
        shortCode: "",
        shortUrl: "",
      })),
      resolve: mock(async () => ""),
    }

    const response = await request(createApp(urlService), "/bad!")

    expect(response.status).toBe(400)
    expect(urlService.resolve).not.toHaveBeenCalled()
  })

  test("forwards service errors to error middleware", async () => {
    const urlService = {
      shorten: mock(async () => ({
        originalUrl: "",
        shortCode: "",
        shortUrl: "",
      })),
      resolve: mock(async () => {
        throw new AppError("short url not found", 404)
      }),
    }

    const response = await request(createApp(urlService), "/missing1")

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({
      status: "fail",
      message: "short url not found",
    })
  })

  test("fails fast when service is not configured", async () => {
    const response = await request(createApp(), "/abc12345")

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      status: "error",
      message: "url service is not configured",
    })
  })
})
