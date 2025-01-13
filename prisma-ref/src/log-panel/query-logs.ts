import { json2csv } from 'json-2-csv';
import * as fs from 'fs'
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
	user:'postgres',
	password: 'JehovahmyGod1234$$#',
	host: 'localhost',
	port: 5432,
	database: 'postgres',
})

async function fetchLogs(query:string,file:string) {
    await client.connect()
    const data = await (await client.query(query)).rows
    const csv = await json2csv(data);
    const path = `../.././src/log-panel/${file}.csv`
    await fs.writeFile(path,csv,(err)=>{console.log('ERROR',err,'PATH',path);})
    console.log(data)
}
let query = fs.readFileSync('../.././src/log-panel/logs.sql', 'utf-8').trim();
fetchLogs(query,'request-logs')