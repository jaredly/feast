
import debug from 'debug';
const info = debug('sync:shared:info');
const warn = debug('sync:shared:warn');
const error = debug('sync:shared:error');

import * as handlers from './shared-handlers';

export default class ShallowShared {
  constructor(rebaser) {
    this.fns = {rebaser};
    this.clients = [];
    this.state = {
      pending: [],
      serverHead: 0,
      pendingStart: 0,
    };;
  }

  addConnection(ws) {
    this.clients.push(ws);
    ws.on('message', ({type, data}) => {
      var result = this.process(type, data);
      ws.send({type: 'result', result});
    });
    // loaded
    if (this.state) {
      this.initConnection(ws);
    }
  }

  initConnection(ws) {
    ws.send({type: 'dump', data: {
      server: null,
      serverHead: 0,
      sharedActions: this.state.pending,
      sharedHead: this.state.pendingStart + this.state.pending.length,
    }});
  }

  enqueueSend() {
    // noop
  }

  process(type, data) {
    info('shared process', type, data);
    var oldState = this.state;
    var result = handlers[type](this.state, this.fns, data);
    info(this.state, result);
    if (!result) {
      return false;
    }
    this.state = result;

    // server rebase
    if (result.serverHead != oldState.serverHead) {
      this.clients.forEach(client => {
        client.send({
          type: 'remoteSync',
          data: {
            oldServerHead: oldState.serverHead,
            newServerHead: result.serverHead,
            oldActions: oldState.pending,
            newActions: result.pending,
            oldSharedHead: oldState.pendingStart + oldState.pending.length,
            newSharedHead: result.pendingStart + result.pending.length,
          },
        });
      });
    }

    // got add actions
    if (result.pending.length > oldState.pending.length) {
      this.clients.forEach(client => {
        client.send({
          type: 'sharedSync',
          data: {
            actions: result.pending.slice(oldState.pending.length),
            serverHead: result.serverHead,
            oldSharedHead: oldState.pendingStart + oldState.pending.length,
            newSharedHead: result.pendingStart + result.pending.length,
          },
        });
      });
    }
    return true;
  }
}



