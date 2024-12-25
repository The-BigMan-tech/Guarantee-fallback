import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface Board {
    name:string
}
const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3100' }),
    endpoints: (builder) => ({
        getItems: builder.query<Board[],void>({
            query:() => '/boards/loadmyBoards',
        }),
        addItem: builder.mutation({
            query: (newItem) => ({
                url: 'items',
                method: 'POST',
                body: newItem,
            }),
        }),
    }),
});
export const { useGetItemsQuery, useAddItemMutation } = apiSlice;
export default apiSlice;