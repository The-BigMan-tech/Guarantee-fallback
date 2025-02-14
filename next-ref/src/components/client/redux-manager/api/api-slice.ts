import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000/server/api' }),
    endpoints:({query}) => ({
        getEcho:query<Record<string,string>,void>({
            query:() => '/users',
        }),
        getPerson:query<Record<string,string>,string>({
            query:(personName:string) => `/users/${personName}`
        })
    }),
});
export const { useGetEchoQuery,useGetPersonQuery } = apiSlice;
export default apiSlice;