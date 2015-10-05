require('babel-core/polyfill');

import db from './db';
import {EventEmitter} from 'events';
import Shared from '../../sync/front/Shared';
import MemRemote from '../../sync/front/MemRemote';

import DexieDB from './DexieDB';
import fakeDb from '../../sync/front/__tests__/fakeDb';
import reducer from './reducer';

require('debug').enable('*warn,*error')

var local = fakeDb(reducer, null, false);
//var local = new DexieDB(db);
var remote = new MemRemote(reducer);
var shared = new Shared(local, remote, reducer);
shared.init().then(
  () => console.log('Shared initialized'),
  err => console.error('Shared init failed - ', err)
);

var id = 0;
var self = new Function('return this')();
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

