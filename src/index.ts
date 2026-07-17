import express from 'express'
import env from "./config/env"
import urlRoute from "./Router/url.router"
import docsRouter from "./Router/docs.router"
import { errorHandler } from './middleware/error.middleware';

const app = express()
const PORT = env.PORT

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
