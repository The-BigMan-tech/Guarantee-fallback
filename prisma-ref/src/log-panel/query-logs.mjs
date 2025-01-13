import { watch } from 'chokidar';
import { json2csv } from 'json-2-csv';
import * as fs from 'fs'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import chalk from 'chalk'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
	user:'postgres',
	password: 'JehovahmyGod1234$$#',
	host: 'localhost',
	port: 5432,
	database: 'postgres',
})
await client.connect()
async function fetchLogs(query,file) {
    const data = await (await client.query(query)).rows
    const csv = await json2csv(data);
    const path = `${__dirname}/${file}.csv`
    await fs.writeFile(path,csv,()=>{})
}
const watchPath = `${__dirname}/logs.sql`;
const watcher = watch(watchPath, {
    persistent: true,
    recursive: true
});
console.log(chalk.yellow(`Watching the file path: ${chalk.cyan(watchPath)}`));
watcher.on('change', async (path) => {
    console.log(chalk.yellow(`Detected file change at path: ${chalk.cyan(path)}`));
    let query = fs.readFileSync(`${__dirname}/logs.sql`, 'utf-8').trim();
    let file = 'request-logs'
    await fetchLogs(query,file);
    console.log(chalk.green(`Successfully loaded the logs into the ${file} csv file`));
});