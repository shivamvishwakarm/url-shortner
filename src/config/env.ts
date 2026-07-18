import "dotenv/config"
import process from "node:process"
import zod, { z } from "zod"


 const envSchema = zod.object({
    PORT : z.coerce.number().int().positive(),
    DATABASE_URL: z.string().min(1),
    BASE_URL: z.string().url().optional(),
 })

 const parsed = envSchema.safeParse(process.env)


if (parsed.error) {
    console.error("Invalid env variables")
    console.error(parsed.error)
    process.exit(1)
}

const env = {
    ...parsed.data,
    BASE_URL: parsed.data.BASE_URL ?? `http://localhost:${parsed.data.PORT}`,
};

export default env
