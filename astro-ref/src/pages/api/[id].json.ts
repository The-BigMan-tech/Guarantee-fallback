interface Person {
    id:string,
    name:string
}
export function getStaticPaths() {
    return [
        {params:{id:'0'}},
        {params:{id:'1'}}
    ]
}
const people = ['john','']
export async function GET({params}:{params:Person}) {
    const name = people[Number(params.id)]
    if (name) {
        return new Response(JSON.stringify({name:name}))
    }else {
        return new Response(JSON.stringify({name:'There is no name'}))
    }
}
