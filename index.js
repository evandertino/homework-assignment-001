/** 
 * Primary file for the API
 * 
*/

// Dependency
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

// Instantiating the HTTP server
const httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res)
});

// Start the HTTP server
httpServer.listen(config.httpPort, function () {
    console.log('The server is listening on port %s', config.httpPort);
});

const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};

// Instantiate the HTTPS server
const httpsServer = https.createServer(httpsServerOptions, function (req, res) {
    unifiedServer(req, res)
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function () {
    console.log('The server is listening on port %s', config.httpsPort);
});

// All the server logic for both the HTTP and HTTPS server
const unifiedServer = function (req, res) {
    // Get the url and parse it
    const parsedUrl = url.parse(req.url, true);

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    const queryStringObject = parsedUrl.query;

    // Get the HTTP Method
    const method = req.method.toUpperCase();

    // Get the headers as an object
    const headers = req.headers;

    // Get the payload if any
    const decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function (data) {
        buffer += decoder.write(data);
    });
    req.on('end', function () {
        buffer += decoder.end();

        // Choose the handler this request should go to. If one is not found use the Not Found handler.
        const chosenHandler = typeof (router[trimmedPath]) != 'undefined' ? router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        const data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        };

        // Route the request to the handler specified in the router
        chosenHandler(data, function (statusCode, payload) {
            // Use the status code called back by the handler or default to 200.
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

            // Use the payload called back by the handler, or default to an empty object.
            payload = typeof (payload) == 'object' ? payload : {};

            // Convert the payload to a string
            const payloadString = JSON.stringify(payload);

            // Return the reponse
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
        });
    });
};

// Define the handlers
const handlers = {};

// Hello Handler
handlers.hello = function (data, callback) {
    callback(200, { 'message': 'Hello welcome to my first non dependency NodeJS restful API, am so excited.' });
};

// Define a Not found handler
handlers.notFound = function (data, callback) {
    callback(404);
};

// Define a request router
const router = {
    'hello': handlers.hello
};