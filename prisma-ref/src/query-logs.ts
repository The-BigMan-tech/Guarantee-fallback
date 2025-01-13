import postgres from 'postgres'
import { json2csv } from 'json-2-csv';
import * as fs from 'fs'

const sql = postgres({
    host: 'localhost',      // PostgreSQL server address
    port: 5432,             // PostgreSQL server port
    username: 'postgres', // Your PostgreSQL username
    password: 'JehovahmyGod1234$$#', // Your PostgreSQL password
    database: 'postgres', // The name of your database
})
async function fetchData(table:string,file:string) {
    const data = await sql`SELECT * FROM ${sql(table)}`;
    const csv = await json2csv(data);
    await fs.writeFile(`.././src/${file}.csv`,csv,(err)=>{console.log('ERROR',err);})
}
await fetchData('RequestLogs','request-logs')
