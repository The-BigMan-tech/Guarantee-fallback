import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3100' }),
    endpoints: (builder) => ({
        getItems: builder.query({
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