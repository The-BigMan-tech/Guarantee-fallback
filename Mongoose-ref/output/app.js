import express from 'express';
const app = express();
app.get('/', (request, response) => {
});
const PORT = 5100;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
