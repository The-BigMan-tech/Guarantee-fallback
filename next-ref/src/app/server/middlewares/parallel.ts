import { NextRequest,NextResponse } from "next/server"

export default function parallelMiddleware(request:NextRequest,origin:string) {
    const newURL = `${origin}/routes/server-sample/y`;
    console.log('NEW URL: ',newURL);
    const response =  NextResponse.rewrite(newURL);
    console.log('RESPONSE: ',response)
    return response;
    // return NextResponse.next()
}

