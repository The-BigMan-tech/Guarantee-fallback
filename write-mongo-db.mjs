//@ts-ignore
import { MongoClient } from 'mongodb';
import * as fs from 'fs'

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



const collection = await returnCollection('boards')
const data = JSON.stringify(await taskDataCollection.find({}).toArray())
await fs.writeFile(`${__dirname}/mongo.json`,data,(err)=>{console.log('ERROR',err);})