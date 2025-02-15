export const dynamic = 'force-static'
export const revalidate = 60

export async function GET() {
    return Response.json({name: 'John Doe'})
}
export async function POST(request:Request) {
    const payload = await request.json()
    return Response.json({message:`Successfully added the person: ${payload.name}`})
}