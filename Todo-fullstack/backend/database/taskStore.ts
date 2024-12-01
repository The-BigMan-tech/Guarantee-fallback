import { connectToDB } from "./connection.js";

interface TaskData {
    name:string | undefined
}

async function returnCollection(name:string) {
    let taskDataCollection;
    const db = await connectToDB()
     //*Checks if collection exists before creating it.
    const collections = await db.listCollections({ name:name}).toArray();
    if (!collections.length ){
        console.log("Creating collection");
        return await db.createCollection(name)
    }else {
        console.log("Collection already exists");
        return await db.collection('taskData')
    }
}
export async function addTaskToDB(tasks:TaskData) {
    const taskDataCollection = await returnCollection('taskData')
    await taskDataCollection.insertOne(tasks)
}

export async function getTaskFromDB() {
    const db = await connectToDB()
    return
}
export async function deleteTaskFromDB(tasks:TaskData[]) {
    const db = await connectToDB()
}