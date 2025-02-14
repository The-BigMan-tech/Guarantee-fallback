export default async function ServerSample2({params}:{params:Promise<{id:string,name:string}>}) {
    const userId = (await params).id
    const username = (await params).name

    return (
        <>
            <h1>Dynamic user id: {userId}</h1>
            <h1>Dynamic username: {username}</h1>
        </>
    )
}