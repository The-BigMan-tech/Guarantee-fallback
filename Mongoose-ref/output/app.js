import express from 'express';
import { router } from './routers/route.js';
const app = express();
app.use('/validate', router);
app.use(express.json());
app.get('/', (request, response) => {
    response.send('Hello World');
});
const PORT = 5100;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
