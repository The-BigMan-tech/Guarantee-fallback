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
    addTaskToDB(taskData)
    response.send(`Seen data,${taskData}`)
})
app.get('/getTask',async (request:Request,response:Response)=>{
    tasks = await getTaskFromDB()
    response.json(tasks)
})
app.delete('/deleteTask/:task',(request:Request,response:Response)=>{
    const task_to_remove = JSON.parse(decodeURIComponent(request.params.task));
    deleteTaskFromDB(task_to_remove)
    response.status(204).send(`Deleted the task: ${task_to_remove}`)
})
app.listen(4000,()=>console.log("Server is running on the port 4000"))