
import express from 'express';
import bodyParser from 'body-parser';
import setupExpress from '../sync/back/express';
import MemDB from '../sync/back/db.js';

var db = new MemDB();
var app = express();
app.use(bodyParser.json());
setupExpress(app, db);
