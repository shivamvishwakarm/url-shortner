import process from "node:process"
import zod, { z } from "zod"



 const envSchema = zod.object({
    PORT : z.coerce.number().int().positive()
 })

 const parsed = envSchema.safeParse(process.env)


if (parsed.error) {
    console.error("Invalid env variables")
    console.error(parsed.error)
    process.exit(1)
}


const env = parsed.data;

export default env