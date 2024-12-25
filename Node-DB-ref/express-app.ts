//*I changed the output directpry of all my js files to the compiled-js folder to free my code from all the compiled js clutter and i also changed the icon of the folder.
import express,{Express} from 'express'
import { Request,Response } from 'express';
import { getFood } from './database/food-db.js';
import { closeConnection } from './database/connection.js'

const app:Express = express()
app.use(express.json())

app.get('/pixel',async (request:Request,response:Response) => {
        const data = await getFood('CraftyNinja');  
        response.json(data)
    }
);
process.on('SIGINT',async ()=>{
    console.log("Shutting down the server");
    await closeConnection()
    process.exit(0)
})
app.listen(4000,()=>console.log('Connection successful.Listening on port 4000'))