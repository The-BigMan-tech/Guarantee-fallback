import {Request,Response,NextFunction} from 'express';

export function validateUser(request:Request,response:Response,next:NextFunction) {
    let  userpassword:unknown = request.headers['authorization'];
    const validpassword:string = 'password1234';
    if ((userpassword as string) == validpassword) {
        console.log("password matches",userpassword);
        next();
    }else {
        console.log(userpassword);
        response.status(401).send('Unauthorized');
    }
}