import { connectDB } from "./connection.js";
export async function getFood(name:string) {
    const db = await connectDB()
    const some = db.collection('gamers')
    const gamer = await some.findOne({name:name});
    return gamer
}   