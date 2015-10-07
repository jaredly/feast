
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import ExpressAdapter from '../../sync/front/ExpressAdapter';
import MemRemote from '../../sync/front/MemRemote';

import reducer from '../front/reducer';
import WebsocketBack from '../../sync/front/WebsocketBack';  

const server = new http.Server();
const app = express();
app.use(cors());
app.use(bodyParser.json());
const remote = new MemRemote(reducer);
WebsocketBack(server, remote);
ExpressAdapter(app, remote);

server.on('request', app);
server.listen(6110, () => console.log('Listening on http://localhost:6110'));
