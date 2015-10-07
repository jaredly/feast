
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import ExpressAdapter from '../../sync/front/ExpressAdapter';
import MemRemote from '../../sync/front/MemRemote';

import reducer from '../front/reducer';

const server = http.server();
const app = express();
app.use(cors());
app.use(bodyParser.json());
const remote = new MemRemote(reducer);
// const wsManager = new WSManager(server, remote);
ExpressAdapter(app, remote);

app.listen(6110, () => console.log('Listening on http://localhost:6110'));
