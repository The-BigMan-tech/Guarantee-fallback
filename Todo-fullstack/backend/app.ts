import express,{Express,NextFunction,Request,Response} from 'express'
import { closeConnection } from './database/connection.js'
//@ts-ignore
import cors from 'cors'
import { postTask,getTask } from './database/taskStore.js'

interface TaskData {
    name:string | undefined
}
let tasks:TaskData[] = []
const app:Express = express()
app.use(express.json())
app.use(cors())


app.post('/addTask',(request:Request,response:Response)=>{
    let taskData:TaskData = request.body;
    tasks.push(taskData)
    console.log(tasks);
    response.send(`Seen data,${taskData}`)
})
app.get('/getTask',(request:Request,response:Response)=>{
    tasks = tasks.filter((task)=>task.name != '')
    response.json(tasks)
})
app.delete('/deleteTask/:id',(request:Request,response:Response)=>{
    console.log("received delete operation");
    const remove = JSON.parse(decodeURIComponent(request.params.id));
    console.log(`REMOVING THE TASK:${JSON.stringify(remove)}`);
    tasks = tasks.filter(task => task.name !== remove.name);
    console.log("Current task data:",tasks);
    response.status(204).send()
})
app.listen(4000,()=>console.log("Server is running on the port 4000"))