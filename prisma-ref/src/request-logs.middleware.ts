import { Request, Response, NextFunction } from 'express';
import { PrismaClient,Prisma} from '@prisma/client';
const prisma = new PrismaClient()

function returnTimeStamp(date:Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}Z`
}
export async function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
    const timestamp = returnTimeStamp(new Date())
    const method = req.method;
    const url = req.url;   
    const logRecord:Prisma.RequestLogsCreateInput = {
        requestTimestamp:timestamp,
        method:method,
        url:url
    }
    await prisma.requestLogs.create({data:logRecord})
    next();
    
}