//*A hyperlink is a static link from one page to another
//*a route is a mapping between a url path and its operations or resources
//*route handlers is a function that responds to a particular http request on a specific route and thus,contains all the logic required to respond
//*middlewares are general functions that have access to the next object
//*an express app is just composed of the mounting method,the route and the function that is called on the route
import express from 'express';
import { router } from './child.js';
const app = express();
app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.static('public'));
app.use('/child', router);
app.use((request, response, next) => {
    const req = request;
    req.user = 'Midddle ware';
    next();
});
app.get('/', (request, response) => {
    const req = request;
    response.send(`response body ${req.user}`);
});
app.get('/pug', (request, response) => {
    response.render('index', { text: null });
});
//!i skipped installable middleware
app.listen(4000);
