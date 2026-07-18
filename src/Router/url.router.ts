import { Router, type NextFunction, type Request, type Response } from "express"
import { validate } from "../middleware/validate"
import {
  shortenBodySchema,
  shortIdParamSchema,
  type ShortenBody,
  type ShortIdParam,
} from "../schema/url.schema"
import type { createUrlService } from "../service/url.service"
import { AppError } from "../utils/AppError"

type UrlService = ReturnType<typeof createUrlService>

type UrlRouterDependencies = {
  urlService?: UrlService
}

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>

const asyncHandler =
  (handler: AsyncRouteHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next)
  }

const getUrlService = (req: Request, urlService?: UrlService) => {
  const service = urlService ?? req.app.locals.urlService

  if (!service) {
    throw new AppError("url service is not configured", 500)
  }

  return service as UrlService
}

export const createUrlRouter = ({
  urlService,
}: UrlRouterDependencies = {}) => {
  const urlRouter = Router()

  urlRouter.post(
    "/shorten",
    validate(shortenBodySchema),
    asyncHandler(async (req, res) => {
      const body = req.body as ShortenBody
      const service = getUrlService(req, urlService)
      const result = await service.shorten(body.url, body.alias)

      res.status(201).json({
        data: result,
      })
    }),
  )

  urlRouter.get(
    "/:shortId",
    validate(shortIdParamSchema, "params"),
    asyncHandler(async (req, res) => {
      const { shortId } = req.params as ShortIdParam
      const service = getUrlService(req, urlService)
      const originalUrl = await service.resolve(shortId)

      res.redirect(302, originalUrl)
    }),
  )

  return urlRouter
}

export default createUrlRouter()
