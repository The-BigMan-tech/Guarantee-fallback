var http = require('http');
var port = 4000;
var hostname = 'localhost';
var server = http.createServer(function (request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/plain'); //*A function not an assignment
    response.write('Hello');
    response.end('\nserver is closed this time');
});
