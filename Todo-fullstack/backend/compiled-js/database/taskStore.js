var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { returnCollection, returnLastDocument } from "./connection.js";
export function addTaskToDB(task) {
    return __awaiter(this, void 0, void 0, function* () {
        const taskDataCollection = yield returnCollection('taskData');
        yield taskDataCollection.insertOne(task);
    });
}
export function getTaskFromDB() {
    return __awaiter(this, void 0, void 0, function* () {
        const taskDataCollection = yield returnCollection('taskData');
        return taskDataCollection.find({}).toArray();
    });
}
export function deleteTaskFromDB(task) {
    return __awaiter(this, void 0, void 0, function* () {
        const taskDataCollection = yield returnCollection('taskData');
        const lastDocument = yield returnLastDocument(taskDataCollection, { name: task.name });
        yield taskDataCollection.deleteOne({ _id: lastDocument[0]._id });
    });
}
export function updateTaskToDB(originalTask, newTask) {
    return __awaiter(this, void 0, void 0, function* () {
        const taskDataCollection = yield returnCollection('taskData');
        yield taskDataCollection.updateOne(originalTask, { $set: { name: newTask.name } });
    });
}
