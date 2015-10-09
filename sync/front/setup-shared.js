import {EventEmitter} from 'events';
import Shared from './Shared';
import RESTAdapter from './RESTAdapter';
import WebSocketWrapper from './WebsocketWrapper';

export default ({
  url,
  local,
  rebaser,
}) => {
  const remote = WebSocketWrapper(
    `ws://${url}/`,
    RESTAdapter(`http://${url}/`)
  );

  const shared = new Shared(local, remote, rebaser);
  shared.init().then(
    () => console.log('Shared initialized'),
    err => console.error('Shared init failed - ', err)
  );

  var id = 0;

  // connections from open tabs
  self.onconnect = function (e) {
    var num = ++id;
    var port = e.ports[0];
    port.start();

    var client = new EventEmitter();
    port.onmessage = e => {
      // console.log('fron client', num, e.data)
      client.emit('message', e.data);
    }
    client.send = data => {
      // console.log('to client', num, data)
      port.postMessage(data);
    }

    shared.addConnection(client);
  }

  return shared;
}

