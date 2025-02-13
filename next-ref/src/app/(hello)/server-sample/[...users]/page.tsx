//!Dont actually use their indexes as keys.Its only for testing something quickly
export default async function CatchUsers({params}:{params:Promise<{users:string[]}>}) {
    const users = (await params).users
    return (
        <>
            {users.map((user,index)=><h1 key={index}>Received user: {user}</h1>)}
        </>
    )
}
