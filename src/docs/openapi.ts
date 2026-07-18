export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "URL Shortener API",
    version: "1.0.0",
    description: "API for creating and resolving shortened URLs.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local server",
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Check service health",
        responses: {
          "200": {
            description: "Service is healthy",
          },
        },
      },
    },
    "/shorten": {
      post: {
        summary: "Create a short URL",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url"],
                properties: {
                  url: {
                    type: "string",
                    format: "uri",
                    example: "https://example.com/docs",
                  },
                  alias: {
                    type: "string",
                    minLength: 8,
                    maxLength: 8,
                    pattern: "^[a-zA-Z0-9_-]+$",
                    example: "docs2026",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Short URL created",
          },
          "400": {
            description: "Invalid request body",
          },
          "409": {
            description: "Alias already exists",
          },
        },
      },
    },
    "/{shortId}": {
      get: {
        summary: "Resolve a short URL",
        parameters: [
          {
            name: "shortId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              minLength: 3,
              maxLength: 30,
              pattern: "^[a-zA-Z0-9_-]+$",
            },
            example: "docs2026",
          },
        ],
        responses: {
          "302": {
            description: "Redirects to original URL",
          },
          "404": {
            description: "Short URL not found",
          },
        },
      },
    },
  },
} as const
