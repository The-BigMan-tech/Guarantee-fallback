export const dynamic = 'force-static'
export const revalidate = 60

export async function GET() {
    return Response.json({name: 'John Doe'})
}