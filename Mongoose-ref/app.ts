import express,{Express} from 'express'

const app:Express = express()

app.get('/',(request,response)=>{
    
})
const PORT = 5100
app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`))
