import {Router} from "express"
import { shortenBodySchema, type ShortenBody  } from "../schema/url.schema";
import { validate } from "../middleware/validate";

const urlRouter = Router()


urlRouter.post('/shorten',validate(shortenBodySchema), (req,res)=> {




})


urlRouter.get('/:shortId', (req,res)=> {



})

export default urlRouter;