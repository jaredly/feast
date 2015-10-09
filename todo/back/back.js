#!/usr/bin/env babel-node

import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import ExpressAdapter from '../../sync/back/ExpressAdapter';
import FileRemote from '../../sync/back/FileRemote';

import reducer from '../front/reducer';
import WebsocketBack from '../../sync/back/WebsocketBack';  

const server = new http.Server();
const app = express();
app.use(cors());
app.use(bodyParser.json());
const remote = new FileRemote(reducer, __dirname + '/actions.txt');
WebsocketBack(server, remote);
ExpressAdapter(app, remote);

server.on('request', app);
server.listen(6110, () => console.log('Listening on http://localhost:6110'));
