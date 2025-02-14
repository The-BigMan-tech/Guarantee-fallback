'use client'
import { useGetEchoQuery } from "@/components/client/redux-manager/api/api-slice";

export default function Consumer() {
    const {data,isLoading} = useGetEchoQuery()
    if (isLoading) {
        return <h1>Loading...</h1>
    } else {
        return <h1>Hello consumer: {data?.name}</h1>;
    }
}