'use client'
import { useGetEchoQuery,useGetPersonQuery} from "@/components/client/redux-manager/api/api-slice";

export default function Consumer() {
    const {data,isLoading} = useGetEchoQuery()
    const {data:personData,isLoading:isPersonLoading,error:personError} = useGetPersonQuery('john')
    if (isLoading) {
        return <h1>Loading...</h1>
    } 
    return (
        <>
            <h1 className="text-green-500">Hello consumer: {data?.name}</h1>
            {isPersonLoading
                ?<h1>Loading Person....</h1>
                :(personError)
                    ?<h1 className="text-red-600">There was an error loading the person</h1>
                    :<h1 className="text-green-500">Here is the dynamic person data: {personData?.name}</h1>
            }
        </>
    );
}