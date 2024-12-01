var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { connectToDB } from "./connection.js";
function returnCollection(name) {
    return __awaiter(this, void 0, void 0, function* () {
        let taskDataCollection;
        const db = yield connectToDB();
        //*Checks if collection exists before creating it.
        const collections = yield db.listCollections({ name: name }).toArray();
        if (!collections.length) {
            console.log("Creating collection");
            return yield db.createCollection(name);
        }
        else {
            console.log("Collection already exists");
            return yield db.collection('taskData');
        }
    });
}
export function addTaskToDB(tasks) {
    return __awaiter(this, void 0, void 0, function* () {
        const taskDataCollection = yield returnCollection('taskData');
        yield taskDataCollection.insertOne(tasks);
    });
}
export function getTaskFromDB() {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
        return;
    });
}
export function deleteTaskFromDB(tasks) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield connectToDB();
    });
}
