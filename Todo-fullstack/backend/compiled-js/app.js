var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import { closeConnectionToDB } from './database/connection.js';
import { addTaskToDB, getTaskFromDB, deleteTaskFromDB, updateTaskToDB } from './database/taskStore.js';
//@ts-ignore
import cors from 'cors';
let tasks = [];
const app = express();
app.use(express.json());
app.use(cors());
app.post('/addTask', (request, response) => {
    let taskData = request.body;
    addTaskToDB(taskData);
    response.send(`Seen data,${taskData}`);
});
app.get('/getTask', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    tasks = yield getTaskFromDB();
    response.json(tasks);
}));
app.delete('/deleteTask/:task', (request, response) => {
    const task_to_remove = JSON.parse(decodeURIComponent(request.params.task));
    deleteTaskFromDB(task_to_remove);
    response.status(204).send(`Deleted the task: ${task_to_remove}`);
});
app.put('/editTask/:task', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const task_to_update = JSON.parse(decodeURIComponent(request.params.task));
    tasks = yield getTaskFromDB();
    updateTaskToDB(tasks[task_to_update.index], task_to_update);
    response.status(204).send(`Edited the task ${task_to_update}`);
}));
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Shutting down the server");
    yield closeConnectionToDB();
    process.exit(0);
}));
app.listen(4000, () => console.log("Server is running on the port 4000"));
