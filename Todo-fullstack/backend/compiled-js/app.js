import express from 'express';
//@ts-ignore
import cors from 'cors';
let tasks = [];
const app = express();
app.use(express.json());
app.use(cors());
app.post('/addTask', (request, response) => {
    let taskData = request.body;
    tasks.push(taskData);
    console.log(tasks);
    response.send(`Seen data,${taskData}`);
});
app.get('/getTask', (request, response) => {
    tasks = tasks.filter((task) => task.name != '');
    response.json(tasks);
});
app.delete('/deleteTask/:id', (request, response) => {
    console.log("received delete operation");
    const remove = JSON.parse(decodeURIComponent(request.params.id));
    console.log(`REMOVING THE TASK:${JSON.stringify(remove)}`);
    tasks = tasks.filter(task => task.name !== remove.name);
    console.log("Current task data:", tasks);
    response.status(204).send();
});
app.listen(4000, () => console.log("Server is running on the port 4000"));
