import type { Express } from "express"

export const request = async (
  app: Express,
  path: string,
  init?: RequestInit,
) => {
  const server = await new Promise<ReturnType<Express["listen"]>>(
    (resolve, reject) => {
      const listener = app.listen(0, () => resolve(listener))
      listener.once("error", reject)
    },
  )
  const address = server.address()

  if (!address || typeof address === "string") {
    await closeServer(server)
    throw new Error("test server did not bind to a port")
  }

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, init)
  } finally {
    await closeServer(server)
  }
}

const closeServer = async (server: ReturnType<Express["listen"]>) => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}
