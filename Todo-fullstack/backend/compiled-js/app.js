import express from 'express';
import { addTaskToDB, getTaskFromDB, deleteTaskFromDB } from './database/taskStore.js';
//@ts-ignore
import cors from 'cors';
let tasks = [];
const app = express();
app.use(express.json());
app.use(cors());
app.post('/addTask', (request, response) => {
    let taskData = request.body;
    console.log(taskData);
    addTaskToDB(taskData);
    response.send(`Seen data,${taskData}`);
});
app.get('/getTask', (request, response) => {
    getTaskFromDB();
    tasks = tasks.filter((task) => task.name != '');
    response.json(tasks);
});
app.delete('/deleteTask/:id', (request, response) => {
    console.log("received delete operation");
    const remove = JSON.parse(decodeURIComponent(request.params.id));
    console.log(`REMOVING THE TASK:${JSON.stringify(remove)}`);
    tasks.splice(tasks.lastIndexOf(remove.name), 1);
    deleteTaskFromDB(tasks);
    console.log("Current task data:", tasks);
    response.status(204).send();
});
app.listen(4000, () => console.log("Server is running on the port 4000"));
