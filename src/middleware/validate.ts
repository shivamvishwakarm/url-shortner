// middleware/validate.ts
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodError, ZodType } from 'zod';

type source = 'body' | 'params' | 'query';


export function validate<T extends ZodType>(schema: T, source: source = 'body'): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {

    try {
        const validationResult = schema.parse(req.body)
        req[source]  = validationResult
        next()

    } catch(error) {

        if(error instanceof ZodError) {
            return res.status(400).json({error: error.issues})
        }
        next()
    }
  };
}