import pkg from '@apollo/client';
const { ApolloClient, InMemoryCache, gql } = pkg;

import colorizer from 'json-colorizer'
const {colorize} = colorizer

const client = new ApolloClient({
    uri: 'http://localhost:2400/graphql',
    cache: new InMemoryCache(),
});
const GET_USERS = gql`
    query getAllUsers {
        allUsers {
            name
            email
        }
    }
`;
const GET_USER = gql`
    query getUserById($stringID:ID!,$Bool:Boolean = true) {
        one:user(id:$stringID) {
            ...commonFields @include(if:$Bool)
        }
        two:user(id:$stringID) {
            ...commonFields
        }
        allUsers {
            ...commonFields
        }
    }
    fragment commonFields on User {
        name
        email
    }
`
const response = await client.query({query:GET_USER,variables:{stringID:'1',Bool:false}})
console.log(colorize(response));