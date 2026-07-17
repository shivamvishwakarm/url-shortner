import express from 'express'
import env from "./config/env"
import urlRoute from "./Router/url.router"

const app = express()
const PORT = env.PORT

app.use(urlRoute)


app.get('/health', (_,res)=> {
    res.send({status: "Healthy", timestamp: new Date().toISOString()}).status(200)
})


app.listen(PORT, ()=> {
    console.log("Server is running PORT", PORT)
})