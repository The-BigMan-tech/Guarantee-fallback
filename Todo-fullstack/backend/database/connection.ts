//@ts-ignore
import {MongoClient,Db,Collection} from 'mongodb'
const client = new MongoClient("mongodb://localhost:27017/");
let database:Db;

export async function connectToDB() {
    try {
        if (!database) database = client.db('MY_DATABASE');
        return database
    }catch(error) {
        console.log(`Database connection error: ${error}`);
    }
}
export async function returnCollection(name:string) {
    const db = await connectToDB()
    const collections = await db.listCollections({ name:name}).toArray();
    if (!collections.length ) return await db.createCollection(name)
    return await db.collection(name)
}
export async function returnLastDocument(collection:Collection,query:Object) {
    return collection.find(query).sort({ _id: -1 }).limit(1).toArray()
}
export async function closeConnectionToDB() {
    await client.close()
}



