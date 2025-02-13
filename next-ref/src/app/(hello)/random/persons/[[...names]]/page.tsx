export default async function CatchUsers({params}:{params:Promise<{names:string[]}>}) {
    const users = (await params).names
    if (users) {
        return (
            <>
                {users.map((user,index)=><h1 key={index}>Received user: {user}</h1>)}
            </>
        )
    }else {
        return <h1 className="text-red-500">You didnt provide any users</h1>
    }
}