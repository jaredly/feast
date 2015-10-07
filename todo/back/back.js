
import express from 'express';
import bodyParser from 'body-parser';
import ExpressAdapter from '../../sync/front/ExpressAdapter';
import MemRemote from '../../sync/front/MemRemote';

import reducer from '../front/reducer';

const app = express();
app.use(bodyParser.json());
const remote = new MemRemote(reducer);
ExpressAdapter(app, remote);

app.listen(6110);
