import { connectDB } from "./connection.js";

export async function postTask() {
    const db = await connectDB()
}
export async function getTask() {
    const db = await connectDB()
}