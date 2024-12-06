import { validateUser } from "../middleware/userMiddleware.js";
import { Router } from "express";

export const router = Router();
router.get('/',validateUser, (request, response) => {
    response.send('hello world');
})