#!/usr/bin/env babel-node

import http from 'http';
import express from 'express';

import ExpressAdapter from '../../sync/back/ExpressAdapter';
import WebsocketBack from '../../sync/back/WebsocketBack';  
import FileRemote from '../../sync/back/FileRemote';

import reducer from '../front/util/reducer';

const app = express();
const server = http.createServer(app);

app.use(require('cors')());
app.use(require('body-parser').json());

const remote = new FileRemote(reducer, __dirname + '/actions.txt');

// make a websocket server, and decorate `remote` to broadcast changes
WebsocketBack(server, remote);
// make the enpoints on `app` to interact with `remote`
ExpressAdapter(app, remote);

server.listen(6110, () => console.log('Listening on http://localhost:6110'));
