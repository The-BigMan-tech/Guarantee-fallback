import express,{Express,Request,Response} from 'express'
import mongoose from 'mongoose'
import { connectToDB } from './database/connection.js'
import { sampleDB } from './models/model.js'


const app:Express = express()


app.use(express.json())
app.get('/',(request:Request,response:Response)=>{
    response.send('Hello World')
})
app.post('/post',async (request:Request,response:Response)=>{
    
})
const PORT = 5100
app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`))
