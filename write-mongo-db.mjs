//@ts-ignore
import { MongoClient } from 'mongodb';
import * as fs from 'fs'

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export async function connectToDB() {
    try {
        const client = new MongoClient("mongodb://localhost:27018/");
        const database = client.db('Kanbans');
        return database
    }catch(error) {
        console.log(`Database connection error: ${error}`);
    }
}
export async function returnCollection(name) {
    const db = await connectToDB()
    const collections = await db.listCollections({ name:name}).toArray();
    if (!collections.length ) return await db.createCollection(name)
    return await db.collection(name)
}

const collection = await returnCollection('boards')
const data = JSON.stringify(await collection.find({}).toArray())
await fs.writeFile(`${__dirname}/mongo.json`,data,(err)=>{console.log('ERROR',err);})