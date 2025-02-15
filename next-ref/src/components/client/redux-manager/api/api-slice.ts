import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000/server/api' }),
    endpoints:({query,mutation}) => ({
        getEcho:query<Record<string,string>,void>({
            query:() => '/users',
        }),
        getSearch:query<{message:string},string>({
            query:(personName:string) => `/member?name=${personName}`
        }),
        getPerson:query<Record<string,string>,string>({
            query:(personName:string) => `/users/${personName}`
        }),
        addPerson:mutation<{message:string},{name:string}>({
            query:(newPerson) =>(
                {
                    url:"/users",
                    method:"POST",
                    body:newPerson
                }
            )
        })
    }),
});
export const { useGetEchoQuery,useGetPersonQuery,useAddPersonMutation,useGetSearchQuery} = apiSlice;
export default apiSlice;