import express from 'express'
import env from "./config/env"
import urlRoute from "./Router/url.router"
import docsRouter from "./Router/docs.router"
import { errorHandler } from './middleware/error.middleware';
import { createMemoryCache } from './cache/memory.cache';
import { createUrlRepository } from './repository/url.repository';
import { createUrlService } from './service/url.service';

const app = express()
const PORT = env.PORT
const urlRepository = createUrlRepository(env.DATABASE_URL)
const urlCache = createMemoryCache()

app.locals.urlService = createUrlService({
    repository: urlRepository,
    cache: urlCache,
    baseUrl: env.BASE_URL,
})

app.use(express.json())
app.use("/docs", docsRouter)


app.get('/health', (_,res)=> {
    res.send({status: "Healthy", timestamp: new Date().toISOString()}).status(200)
})

app.use(urlRoute)



app.use(errorHandler)

app.listen(PORT, ()=> {
    console.log("Server is running PORT", PORT)
})
