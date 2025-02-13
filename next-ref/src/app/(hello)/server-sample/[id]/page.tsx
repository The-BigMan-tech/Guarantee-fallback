import ServerComponent from "@/components/server-comp"

export default async function ServerSample({params}:{params:Promise<{id:string}>}) {
    const userId = (await params).id
    return <ServerComponent id={userId}/>
}
