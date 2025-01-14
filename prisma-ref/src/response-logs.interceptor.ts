import {Injectable,NestInterceptor,ExecutionContext,CallHandler,} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaClient,Prisma} from '@prisma/client';
const prisma = new PrismaClient()


function returnTimeStamp(date:Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}Z`
}
@Injectable()
export class responseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const method = request.method
        const url = request.url

        const response = context.switchToHttp().getResponse();
        const startTime = Date.now();
        response.on('finish',()=>{
        })
        return next
            .handle()
            .pipe(
                tap(async () => {
                    const statusCode = response.statusCode
                    const responseTime = Date.now() - startTime;
                    const timestamp = returnTimeStamp(new Date())

                    const logResponse:Prisma.ResponseLogsCreateInput = {
                        responseTimestamp:timestamp,
                        method:method,
                        url:url,
                        statusCode:statusCode,
                        responseTime:responseTime
                    } 
                    await prisma.responseLogs.create({data:logResponse})
                }),
            );
    }
}