//!To properly compile ts files to es module js files,you have to use type:modules in packag.json and specify the files in an array in the tsconfig.json or use include with a glob pattern and dont run tsc on a specific file or else,it will be ignored

//*A hyperlink is a static link from one page to another
//*a route is a mapping between a url path and its operations or resources

//*route handlers is a function that responds to a particular http request on a specific route and thus,contains all the logic required to respond
//*middlewares are general functions that have access to the next object

//*an express app is just composed of the variable to be mounted on,the mounting method which can also indicate the http request it will respond to,the route and the function that is called on the route

//*http architecture--mvc

//*MULTER--For uploading files through multipart form data which is an encoding to submit forms like images or uploading files to the server
//*BODY PARSER--for parsing json data sent over an http request body.Now inbuilt into express as express.json()
//*svgs for designing programmatically


//!Use normal js to check for any false error ts throws.You can use @ts-ignore to tell ts to shut up
import express,{Express,Request,Response,NextFunction} from 'express'
import {router} from './child.js'
//@ts-ignore
import cookieParser from 'cookie-parser';
import session from 'express-session'
import { Session } from 'inspector/promises';


const app:Express = express()
app.set('view engine','pug')
app.set('views','./views')
//*This mounts all these middleware on all the routes
app.use(express.static('public'));//*import and mount
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

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

//*the post method is for uploading data to the server
//*the request will go on forevevr till the server responds
app.post('/post',(request:Request,response:Response)=>{
    let form_data = request.body;
    console.log(form_data);
    if (form_data != '{}') {
        response.json({
            message:"Data uploaded successfully",
            data:form_data
        })
    }
    response.send('No data provided')
})
//*always end the response with response.send or else,it will never end
//*Cookies are like id cards in the office

//*the response writes the cookie and sends it to the client's browser
app.get('/add-cookie',(request:Request,response:Response)=>{
    response.cookie('user','me',{
        maxAge:10000,//*sets the max age of the cookie in msecs
        httpOnly:true,//*blocks js cookie api from accessing the cookie to prevent xss,
        secure:true//*ensures that the cookie will only be sent over http connections
    })
    response.send(`Cookie has been uploaded to the server`)
})


//*The server can acces the cookie from the request object as the cookies are automatically included in the http header of each request
app.get('/view-cookie',(request:Request,response:Response)=>{
    const user = request.cookies.user
    response.send((user)?`User ${user} has been saved as a cookie`:'No cookies here')
})

//*The server instructs the client's browser to  delete the cookie
app.get('/delete-cookie',(request:Request,response:Response)=>{
    response.clearCookie('user')
    response.send('Cleared the use cookie')
})

//*sessions are used for tracking user interactions or state till the page or browser exits like adding items to a cart on an online store

//*so a session cookie is like your account credentials.the money is stored in the bank but the credential info like the session id is stored with each person.A realbank can still know which account has which money but they cant modify that money unless the person requests for one using his credentials which ensures he only touches his own money.The bank checks if it is fake or not like how servers use secret keys in their session to verify id and then,the bank will lookup his cash and give him as requested

//*Although we use one middleware to call the session,different sessions are created differently per user each with their own unique session id and thats why we use the request object to modify the data because it ensures we are only modifying the sessions of each user separately.The session is still stored on the sever but we use the request session cookie data as a lookup 

//*sessions are stored in memory and will be lost after a server restart and thus,not scalable.So we use external stores like mongodb session stores

app.use(session({
    secret:'signature',//*this is the string that will sign a session upon creation and request to ensure it isnt modified by attackers
    resave:false,//*this ensures that a session will only save when it is modified and not on every request
    saveUninitialized:true,//*determines if a session saves if it is empty
    cookie: { //*session cookie config
        maxAge: 1000 * 60 * 15 // Set cookie expiration time (15 minutes)
    }
}))

app.get('/session',(request:Request,response:Response)=>{
    request.session.username = 'hi'//*the value of the data is set by the user through the fetch api
    response.send('session created with username data')
})
app.get('/get-session',(request:Request,response:Response)=>{
    response.send(`Session data: ${request.session.username}`)
})
//*Try out path parameter here.Dynamic routes

app.listen(4000)


