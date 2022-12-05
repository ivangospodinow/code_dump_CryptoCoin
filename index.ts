import settings from './settings';
import { IncomingMessage, ServerResponse } from 'express';
import { apiService, clientService } from './globals';

const express = require('express');
var cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const url = require('url');


app.use(cors());
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.get('*', function getRequest(req: IncomingMessage, res: ServerResponse) {
    apiService.handleRequest(req, res, url.parse(req.url, true).query);
});
app.post('*', function postRequest(req: IncomingMessage, res: ServerResponse) {
    apiService.handleRequest(req, res, url.parse(req.url, true).query, req.body);
});

app.listen(settings.SERVER_PORT, () => {
    console.log(`Started server at ` + settings.SERVER_PORT);
    clientService.start();
});


setInterval(function () {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(` ----------------- The script uses approximately ${Math.round(used * 100) / 100} MB`);
}, 10000);


// //create a server object:
// http.createServer(function serverRequest(req: IncomingMessage, res: ServerResponse) {
//     console.log('REQUEST received');
//     if (req.method === 'POST') {
//         let resData = '';
//         res.on('data', function requestReposnseData(chunk: string) {
//             resData += chunk;
//         }).on('end', function requestResponseEnd() {
//             console.log('Data received');
//             apiService.handleRequest(req, res, url.parse(req.url, true).query, JSON.parse(resData));
//         });
//     } else {
//         apiService.handleRequest(req, res, url.parse(req.url, true).query);
//     }
// }).listen(settings.SERVER_PORT); //the server object listens on port 808
// console.log('Listening on port ' + settings.SERVER_PORT);

// // setInterval(() => {
// //     console.log((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + 'mb');
// // }, 5000);



