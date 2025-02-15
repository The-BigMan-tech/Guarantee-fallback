'use client'
import { useGetEchoQuery,useGetPersonQuery,useAddPersonMutation,useGetSearchQuery} from "@/components/client/redux-manager/api/api-slice";
import { useState } from "react";

export default function Consumer() {
    const {data,isLoading} = useGetEchoQuery()
    const {data:searchData,isLoading:isSearching} = useGetSearchQuery('paul')
    const {data:personData,isLoading:isPersonLoading,error:personError} = useGetPersonQuery('john')
    const [addUser,{isLoading:isPostLoading,error:postError}] = useAddPersonMutation()

    const [name,setName] = useState<string>('')
    async function submitPerson() {
        try {
            const response = await addUser({name:name}).unwrap()
            console.log('ADD USER RESPONSE: ',response)
        }catch(err) {
            console.log('There was an error when attempting to update the name: ',err);
        }
    }
    if (isLoading) {
        return <h1>Loading...</h1>
    } 
    return (
        <div className="flex flex-col">
            <h1 className="text-green-500">Hello consumer: {data?.name}</h1>
            <div className="flex">
                <input onChange={(event)=>setName(event.target.value)} value={name} type="text" />
                <button onClick={submitPerson}>Simulate adding a person</button>
            </div>
            {isSearching
                ?<h1>Searching with query parameters...</h1>
                :<h1>Response: {searchData?.message}</h1>
            }
            {isPostLoading
                ?<h1>Posting data ...</h1>
            :(postError)
                ?<h1 className="text-red-500">There was an erro posting the data</h1>
            :<h1 className="text-green-500">Successfully posted the data</h1>
            }
            {isPersonLoading
                ?<h1>Loading Person....</h1>
            :(personError)
                ?<h1 className="text-red-600">There was an error loading the person</h1>
            :<h1 className="text-green-500">Here is the dynamic person data: {personData?.name}</h1>
            }
        </div>
    );
}