import express,{Express,NextFunction,Request,Response} from 'express'
import { closeConnectionToDB} from './database/connection.js'
import { addTaskToDB,getTaskFromDB,deleteTaskFromDB } from './database/taskStore.js'
//@ts-ignore
import cors from 'cors'

interface TaskData {
    name:string | undefined
}
let tasks:TaskData[] = []
const app:Express = express()
app.use(express.json())
app.use(cors())


app.post('/addTask',(request:Request,response:Response)=>{
    let taskData:TaskData = request.body;
    console.log(taskData);
    addTaskToDB(taskData)
    response.send(`Seen data,${taskData}`)
})
app.get('/getTask',(request:Request,response:Response)=>{
    getTaskFromDB()
    tasks = tasks.filter((task)=>task.name != '')
    response.json(tasks)
})
app.delete('/deleteTask/:id',(request:Request,response:Response)=>{
    console.log("received delete operation");
    const remove = JSON.parse(decodeURIComponent(request.params.id));
    console.log(`REMOVING THE TASK:${JSON.stringify(remove)}`);
    tasks.splice(tasks.lastIndexOf(remove.name),1)
    deleteTaskFromDB(tasks)
    console.log("Current task data:",tasks);
    response.status(204).send()
})

app.listen(4000,()=>console.log("Server is running on the port 4000"))