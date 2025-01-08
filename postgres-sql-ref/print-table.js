import postgres from 'postgres'
import { json2csv } from 'json-2-csv';
import * as fs from 'fs'

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const sql = postgres({
    host: 'localhost',      // PostgreSQL server address
    port: 5432,             // PostgreSQL server port
    username: 'postgres', // Your PostgreSQL username
    password: 'JehovahmyGod1234$$#', // Your PostgreSQL password
    database: 'school', // The name of your database
})
async function fetchData(table,file) {
    const data = await sql`SELECT * FROM ${sql(table)}`;
    const csv = await json2csv(data);
    await fs.writeFile(`${__dirname}/${file}.csv`, csv,(err)=>{console.log('ERROR',err);})
}
await fetchData('students','student-table');
await fetchData('staff','staff-table');
