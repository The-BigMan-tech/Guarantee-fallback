/* eslint-disable prettier/prettier */
import { Injectable,NestMiddleware} from "@nestjs/common";
import {Request,Response,NextFunction} from 'express';


@Injectable()
export class experimentMiddleware implements NestMiddleware{
    use(request:Request,response:Response,next:NextFunction) {
        console.log('Middle ware has been called');
        next()
    }
}
export function functionalMiddleware(request:Request,response:Response,next:NextFunction) {
    console.log("Functional middleware has been called");
    next()
}
