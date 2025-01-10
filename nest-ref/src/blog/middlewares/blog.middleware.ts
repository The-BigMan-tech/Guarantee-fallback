/* eslint-disable prettier/prettier */
import {Request,Response,NextFunction} from 'express';

export function blogMiddleware(request:Request,response:Response,next:NextFunction) {
    console.log("Blog middleware has been called");
    next()
}