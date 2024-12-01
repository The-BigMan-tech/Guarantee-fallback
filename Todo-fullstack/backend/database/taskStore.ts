import { returnCollection,returnLastDocument} from "./connection.js"

interface TaskData {
    name:string 
}
export async function addTaskToDB(task:TaskData) {
    const taskDataCollection = await returnCollection('taskData')
    await taskDataCollection.insertOne(task)
}
export async function getTaskFromDB() {
    const taskDataCollection = await returnCollection('taskData')
    return taskDataCollection.find({}).toArray()
}
export async function deleteTaskFromDB(task:TaskData) {
    const taskDataCollection = await returnCollection('taskData')
    const lastDocument = await returnLastDocument(taskDataCollection,{name:task.name})
    await taskDataCollection.deleteOne({ _id:lastDocument[0]._id })
}
export async function updateTaskToDB(originalTask:TaskData,newTask:TaskData) {
    const taskDataCollection = await returnCollection('taskData')
    await taskDataCollection.updateOne(originalTask,{$set:{name:newTask.name}})
}