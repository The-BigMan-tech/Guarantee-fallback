import axios from 'axios'

export default async function ServerComponent() {
    const response = await axios.get('https://b5b11be5b0154ae294307be1e52a6c0d.api.mockbin.io/')
    const message = response.data.message
    return (
        <>
            <h1>Dummy message: {message}</h1>
        </>
    )
}