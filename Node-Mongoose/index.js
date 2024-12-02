import express from 'express';
import dbConnection from './db/conn.js';

const app = express();
app.use(express.json());

dbConnection()
app.get('/', (request, response) => {
    response.send('Server is running');
})
const PORT = 4200
app.listen(PORT, () => console.log(`Server is using port ${PORT}`));;