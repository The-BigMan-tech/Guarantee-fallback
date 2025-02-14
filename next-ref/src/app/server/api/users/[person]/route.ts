export async function GET(request:Request,{params}:{params:Promise<{person:string}>}) {
    const person = (await params).person
    return Response.json({name:person})
}