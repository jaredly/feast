require('babel-core/polyfill');

import db from './db';
import {EventEmitter} from 'events';
import Shared from '../../sync/front/Shared';
import MemRemote from '../../sync/front/MemRemote';

import DexieDB from './DexieDB';
import reducer from './reducer';

var local = new DexieDB(db);
var remote = new MemRemote(reducer);
var shared = new Shared(local, remote, reducer);
shared.init().then(
  () => console.log('Shared initialized'),
  err => console.error('Shared init failed - ', err)
);

var self = new Function('return this')();
self.shared = shared;
// connections from open tabs
self.onconnect = function (e) {
  var port = e.ports[0];
  port.start();

  var client = new EventEmitter();
  port.onmessage = e => client.emit('message', e.data);
  client.send = data => port.postMessage(data);

  shared.addConnection(client);
}

