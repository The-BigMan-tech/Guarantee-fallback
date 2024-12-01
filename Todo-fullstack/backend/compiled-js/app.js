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
    response.json(tasks);
});
app.get('/deleteTask/:id', (request, response) => {
    console.log("received delete operation");
    const remove = request.params.id;
    // tasks.splice(tasks.indexOf(remove))
    console.log(`REMOVING THE TASK:${typeof remove}`);
    response.status(204).send();
});
app.listen(4000, () => console.log("Server is running on the port 4000"));
