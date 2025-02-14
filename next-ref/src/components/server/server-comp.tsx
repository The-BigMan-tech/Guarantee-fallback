import { axiosInstance } from "@/lib/axios-instance"
// import { redirect } from 'next/navigation'

export default async function ServerComponent({id}:{id:string}) {
    const response = await axiosInstance.get('/users')
    const message = response.data.name
    // redirect('/random')
    return (
        <>
            <h1>Dummy message: {message}</h1>
            <h1>Received dynamic id {id}</h1>
        </>
    )
}