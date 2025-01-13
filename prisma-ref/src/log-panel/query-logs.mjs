import { watch } from 'chokidar'; //for watching files
//for converting the data returned from postgres in my code as a json object to a csv for a table format
import { json2csv } from 'json-2-csv';
import * as fs from 'fs' //for writing the csv to a file
import { fileURLToPath } from 'url';//to get the file name and use it to get the directory of the file
import { dirname } from 'path';//to get the directory of the file using the file name
import chalk from 'chalk'//To colorize the putput
//for writing raw sql queries in code.In this case,its for executing the queries from an sql file
import postgres from 'pg';
//For tapping the keyboard shortcut to turn my csv file to a fine table.Requires the csv to table extension
import robot from 'robotjs'
import childProcess from 'child_process'//To get the exec command for opening a csv file


//*Get the current directory of the file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//*Connect to postgres
const { Client } = postgres
const client = new Client({
	user:'postgres',
	password: 'JehovahmyGod1234$$#',
	host: 'localhost',
	port: 5432,
	database: 'postgres',
})
await client.connect()

async function fetchLogs(query,file) {
    const data = await (await client.query(query)).rows//*execute the query and get the data but its in json.
    const csv = await json2csv(data);//*convert it to a csv format
    const path = `${__dirname}/${file}.csv`//*the path to write the csv file to
    await fs.writeFile(path,csv,()=>{})//*Write the csv data to the file path
    /**
     **Open the csv file and press the shortcuts to turn it to a table if the query end in semicolon.
     **Im using it as a terminator so that it only opens the csv table till needed since i cant open the file
     **in the background and turn it to a table
     */
    if (query.endsWith(';')) {
        childProcess.exec(`start ${__dirname}/request-logs.csv`)
        setTimeout(()=>{
            robot.keyTap('t',['control','shift']);
            robot.keyTap('x',['control','shift']);
            robot.keyTap('n',['control','shift']);
        },2000)
    }
}
const watchPath = `${__dirname}/logs.sql`;//*watch the logs.sql file
const watcher = watch(watchPath, {
    persistent: true,//*It should constantly watch it
});
console.log(chalk.yellow(`Watching the file path: ${chalk.cyan(watchPath)}`));

//*When the sql file changes,it calls the fetchLogs funcion and pass in the query from the sql file to get the data needed based on the query and write it to the csv file
watcher.on('change', async (path) => {
    console.log(chalk.yellow(`Detected file change at path: ${chalk.cyan(path)}`));
    let query = fs.readFileSync(`${__dirname}/logs.sql`, 'utf-8').trim();
    let file = 'request-logs'
    await fetchLogs(query,file);
    console.log(chalk.green(`Successfully loaded the logs into the ${file} csv file`));
    console.log(chalk.yellow(`Watching the file path: ${chalk.cyan(watchPath)}`));
});
//*It syncs the pg client with the db through a trigger that was created in the trigger.sql file and update the data in teh csv
client.on('notification', async (msg) => {
    if (msg.channel === 'data_change') {
        console.log('Received notification:', msg.payload);
        let query = fs.readFileSync(`${__dirname}/logs.sql`, 'utf-8').trim();
        let file = 'request-logs'
        await fetchLogs(query,file);
        console.log(chalk.green(`Successfully loaded the logs into the ${file} csv file`));
    }
});
//*Listen to data changes on the pg database
client.query('LISTEN data_change', (err) => {
    if (err) {
        console.error('Error starting listener:', err);
    }
});