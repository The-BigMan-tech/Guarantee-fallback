import { type NextRequest } from 'next/server'

export async function GET(request:NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('name')
    return Response.json({message:`received the name query param;${query}`})
}