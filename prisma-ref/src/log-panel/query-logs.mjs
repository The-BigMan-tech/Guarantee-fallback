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

import robot from 'robotjs'
import childProcess, { ChildProcess } from 'child_process'
import util from 'util'

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
    if (query.endsWith(';')) {
        childProcess.exec(`start ${__dirname}/request-logs.csv`,(error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            robot.keyTap('t', ['control', 'shift']);
        })
    }
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
    console.log(chalk.yellow(`Watching the file path: ${chalk.cyan(watchPath)}`));
});

client.on('notification', async (msg) => {
    if (msg.channel === 'data_change') {
        console.log('Received notification:', msg.payload);
        let query = fs.readFileSync(`${__dirname}/logs.sql`, 'utf-8').trim();
        let file = 'request-logs'
        await fetchLogs(query,file);
        console.log(chalk.green(`Successfully loaded the logs into the ${file} csv file`));
    }
});
// Start listening
client.query('LISTEN data_change', (err) => {
    if (err) {
        console.error('Error starting listener:', err);
    }
});