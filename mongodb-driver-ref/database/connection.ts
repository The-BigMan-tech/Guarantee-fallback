//@ts-ignore
import {MongoClient,Db} from 'mongodb'
const client = new MongoClient("mongodb://localhost:27017/");
let database:Db;
export async function connectDB() {
    if (!database) {
        try {
            database = client.db('TodoDB');
        }
        catch(err) {
            console.log("Database connection error: ",err);
        }
    }
    return database
}
export async function closeConnection() {
    await client.close()
}



