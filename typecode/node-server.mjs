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
import * as fs from 'fs';
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
//!child process,buffer,crypto,dns
//*A buffer is like an array of intergers but for bytes.use for my file transfer
assert.ok(true);
/**
 *
 * @param {string} message  -The message to log
 */
function debug(message) {
    console.debug("\n", chalk.green.underline.bold("Debug:"), message);
}
function info(message) {
    console.info('\n', chalk.yellow.underline.bold("Info:"), message);
}
function warn(message) {
    console.warn('\n', chalk.blue.underline.bold("Warning!:"), message);
}
function error(message) {
    console.error('\n', chalk.red.underline.bold("ERROR!!!:"), message, "\n");
}
debug('hello');
info('INFO');
warn('warning');
error('an error');
//*The file operation is handled to the os separately upon enecounter and is not handled by noe js thread and thus,prevents blocking.once the file operation is complete,the callback gets queued to the macrotask queue as an io callback
fs.readFile('./data.txt', 'utf-8', function (err, data) {
    console.log("FILE DATA:", data);
});
fs.writeFile('./data.txt', 'override', function (err) { return console.log((err) ? err : 'success'); });
fs.appendFile('./data.txt', 'override', function (err) { return console.log((err) ? err : 'success'); });
fs.unlink('./data.txt', function (err) { return console.log((err) ? error(err) : 'success'); });
fs.mkdir('./data.txt', function (err) { return console.log((err) ? err : 'success'); });
