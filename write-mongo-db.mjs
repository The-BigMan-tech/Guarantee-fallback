//@ts-ignore
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as fs from 'fs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let db;

async function connectToDB(connection_string) {
    try {
        const client = new MongoClient(connection_string);
        const database = client.db('Kanbans');
        return database
    }catch(error) {
        console.log(`Database connection error: ${error}`);
    }
}
async function returnCollection(name,db) {
    const collections = await db.listCollections({ name:name}).toArray();
    if (!collections.length ) return await db.createCollection(name)
    return await db.collection(name)
}
async function mongoToJson(info) {
    db = await connectToDB(info.connection_string)
    const collection = await returnCollection('boards',db)
    const data = JSON.stringify(await collection.find({}).toArray())
    await fs.writeFile(`${__dirname}/mongo.json`,data,(err)=>{console.log('ERROR',err);})
}
const info = {
    connection_string:"mongodb://localhost:27018/"
}
await mongoToJson(info)