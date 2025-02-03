export async function GET() {
    return new Response(
        JSON.stringify({
            name:'whatever',
            age:'whatever'
        })
    )
}