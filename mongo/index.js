import express from 'express'
import {routine} from './routes/custom.js'
const app = express()
const port = 5000

app.use('/child',routine)
app.get('/',(request,response)=>{
    response.send('Responded')
})
app.listen(port,()=>console.log(`Running on port ${port}`))