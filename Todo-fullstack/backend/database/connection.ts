//@ts-ignore
import {MongoClient,Db} from 'mongodb'
const client = new MongoClient("mongodb://localhost:27017/");
let database:Db;
export async function connectToDB() {
    if (!database) {
        try {
            database = client.db('MY_DATABASE');
        }
        catch(err) {
            console.log("Database connection error: ",err);
        }
    }
    return database
}
export async function closeConnectionToDB() {
    await client.close()
}



