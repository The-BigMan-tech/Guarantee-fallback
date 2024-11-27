//!To properly compile ts files to es module js files,you have to use type:modules in packag.json and specify the files in an array in the tsconfig.json or use include with a glob pattern and dont run tsc on a specific file or else,it will be ignored
//*A hyperlink is a static link from one page to another
//*a route is a mapping between a url path and its operations or resources

//*route handlers is a function that responds to a particular http request on a specific route and thus,contains all the logic required to respond
//*middlewares are general functions that have access to the next object

//*an express app is just composed of the mounting method,the route and the function that is called on the route

import express,{Express,Request,Response,NextFunction} from 'express'
import {router} from './child.js'

const app:Express = express()
app.set('view engine','pug')
app.set('views','./views')
app.use(express.static('public'));

interface ModRequest extends Request {
    user?:string
}

app.use('/child',router)
app.use((request:Request,response:Response,next:NextFunction)=>{//*the route is optional and the middleware will become global
    const req = request as ModRequest
    req.user = 'Midddle ware'
    next()
})
app.get('/',(request:Request,response:Response)=>{
    const req = request as ModRequest
    response.send(`response body ${req.user}`)
})
app.get('/pug',(request:Request,response:Response)=>{
    response.render('index',{text:null})
})
//!i skipped installable middleware
app.listen(4000)


