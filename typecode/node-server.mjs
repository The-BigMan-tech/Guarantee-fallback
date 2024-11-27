//http server,MVC arhitecture
//chalk module to make my js logger module,ts check,mjs or type:module to the package.json
//node js events
//*null coalescing op.Logic assignment--modern version
//*We use require for already installed packages
//*HTTP communication connects the server to the client,the api brings in another layer and web sockets for real time communication
//*nodemon--like live server but for your node js server,
//*assert and throw
//*so the http header content-type tells the client that the response will deliver a content and text/* is for human consumable content while application/* is for programmatic consumable content
//*the request object is for getting info about the request as defined in the fetch method of the client.The response object is for sending the data using the http protocol
//*default and named exports,common js and mjs.Explicit export model vs python's implicit export model
import chalk from 'chalk'; //*For the default export
import * as http from 'http'; //*For named exports
import * as assert from 'assert';
import * as fileSystem from 'fs';
var port = 4000;
var hostname = 'localhost';
var server = http.createServer(function (request, response) {
    console.log("REQUEST UR", request.url);
    console.log("REQUEST METHOD", request.method);
    response.setHeader('Access-Control-Allow-Origin', '*'); //*Allow CORS
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/plain'); //*A function not an assignment
    response.write('Hello');
    response.end();
});
server.listen(port, hostname, function () { return console.log("Connection to port ".concat(port, " was successful")); });
console.log(chalk.red('hello'));
//?Abstract concept vector illustration
//!process and child process,buffer,crypto,dns,query strings,tls ssl,zlib
//TODO Path module,stream,string decoder,timers,handling json data
//*A buffer is like an array of intergers but for bytes.use for my file transfer
assert.ok(true);
var debug = function (message) { return console.debug(chalk.green.underline.bold("Debug:"), message); };
var info = function (message) { return console.info(chalk.yellow.underline.bold("Info:"), message); };
var warn = function (message) { return console.warn(chalk.blue.underline.bold("Warning!:"), message); };
var error = function (message) { return console.error(chalk.red.underline.bold("ERROR!!!:"), message, "\n"); };
debug('hello');
info('INFO');
warn('warning');
error('an error');
//*The file operation is handled to the os separately upon enecounter and is not handled by noe js thread and thus,prevents blocking.once the file operation is complete,the callback gets queued to the macrotask queue as an io callback.The file operations wont be done in the order they were programmed.Two ways to fix this is through;
//*nesting the callbacks/callback hell or chaining them as promises, or async await promises which error catching blocks allows us to control the order of execution of async code using the state of previous opertations
//*the event loop--timers,io callbacks,set immediate
//*This is for the file ops by the way:but the await here seems to control the order of the file operations so thats what it is used for.It can be used to control the order of async operations and also queue these operations if they dont resolve immediately till after executing the async code but since these particular ops are handled by the os and not node js,they can still run while the main node js thread does other things outside the function
var fs = fileSystem.promises; //*I can also use async await
fs.readFile('./data.txt', 'utf-8')
    .then(function (data) {
    console.log("SUPER DATA", data);
    return fs.writeFile('./data.txt', 'not nice');
})
    .then(function () {
    return fs.appendFile('./data.txt', 'very good');
})
    .catch(function (err) { return console.log("Caught error: ".concat(err)); });
//*the promise consumers dont get scheduled till the promise resolves
var sample_path = 'C:/Users/USER/Desktop/Webnote/web-socket/websocket.txt';
