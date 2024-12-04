/* eslint-disable prettier/prettier */
import { Injectable,NestInterceptor,ExecutionContext,CallHandler} from "@nestjs/common";
import { Observable,tap} from "rxjs";

/**
 * *for user friendly errors and logging
 * *an observable is something that emits some kind of value.they can emit multiple sets of data
 * *operators perform operations on each data and pass it to the next operator
 * *an assembly line of operators is called a pipe
 * *observers are responsible for figuring out what to do with the data returned by the pipeline
 */
@Injectable()
export class blogInterceptor implements NestInterceptor{
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest()
        const now = Date.now()
        return next
            .handle()
            .pipe(
                tap(() => {
                        console.log(`${request.method} ${request.url} ${Date.now() - now}ms`)
                    }
                )
            )
    }
}
