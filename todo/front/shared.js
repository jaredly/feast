require('babel-core/polyfill');

import './enable-debug';
import db from './db';
import {EventEmitter} from 'events';
import Shared from '../../sync/front/Shared';
import MemRemote from '../../sync/front/MemRemote';
import RESTAdapter from '../../sync/front/RESTAdapter';

import makeLocal from './local-db';
import fakeDb from '../../sync/front/__tests__/fakeDb';
import reducer from './reducer';

var self = new Function('return this')();
self.dbg = require('debug');
self.document = {documentElement: {style: {WebkitAppearance: true}}};

function rebaser(actions, oldTail, newTail) {
  return actions;
  // return actions.map(({id, action: {name}}) => ({id, action: {name: name + '+'}}));
}

// var local = fakeDb(reducer, null, false);
const local = makeLocal(db);
const remote = RESTAdapter('http://localhost:6110/')
// const remote = new MemRemote(reducer);
const shared = new Shared(local, remote, rebaser);
shared.init().then(
  () => console.log('Shared initialized'),
  err => console.error('Shared init failed - ', err)
);

var id = 0;
self.shared = shared;
// connections from open tabs
self.onconnect = function (e) {
  console.log('adding connection');
  var num = ++id;
  var port = e.ports[0];
  port.start();

  var client = new EventEmitter();
  port.onmessage = e => {
    console.log('fron client', num, e.data)
    client.emit('message', e.data);
  }
  client.send = data => {
    console.log('to client', num, data)
    port.postMessage(data);
  }

  shared.addConnection(client);
}

