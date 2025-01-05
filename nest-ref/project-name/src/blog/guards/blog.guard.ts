/* eslint-disable prettier/prettier */
import {Injectable,CanActivate, ExecutionContext} from '@nestjs/common';

/**
 * *after authentication,you can add custom properties to store authenticated user data.It can be done by the middleware or the guard
 * *You can use jwt,session or http headers authentication
 * *You can use the @request decorator to access the request user afterward
 * *I can inject models/services into guards,pipes,etc in the constructor method
*/
interface userData {
    username:string,
    password:string
}

@Injectable()
export class BlogGuard implements CanActivate {
    canActivate(context: ExecutionContext):boolean {
        const request = context.switchToHttp().getRequest()
        const token:string = request.headers['authorization'];
        if (token && this.validateToken(token)) {
            request.user = this.validateToken(token)
            return true
        }
        return false
    }
    private validateToken(token:string):userData | null {
        if (token == 'TRUETOKEN') {
            return {username:'someguy',password:'somepassword'}
        }
        return null
    }
}