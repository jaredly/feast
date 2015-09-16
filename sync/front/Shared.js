
import debug from 'debug';
const info = debug('sync:shared:info');
const warn = debug('sync:shared:warn');
const error = debug('sync:shared:error');

import * as handlers from './shared-handlers';

export default class Shared {
  constructor(local, remote, rebaser) {
    this.local = local;
    this.remote = remote;
    this.clients = [];
    this.fns = {rebaser};
    this.state = {
      serverHead: 0,
      pendingStart: 0,
      pending: [],
    };

    this.remote.on('message', ({type, data}) => {
      if (type === 'result') {
        return this.gotResult();
      }
      this.process(type, data);
    });
  }

  init() {
    this.local.dump().then(({pending, data, serverHead}) => {
      this.state = {
        pending,
        serverHead,
        pendingStart: 0,
      };
      this.clients.forEach(client => {
        client.send({type: 'dump', data: {
          serverHead,
          server: data,
          sharedActions: pending,
          sharedHead: pending.length,
        }});
      });
    });
  }

  addConnection(ws) {
    this.clients.push(ws);
    ws.on('message', ({type, data}) => {
      var result = this.process(type, data);
      // TODO give receipt messages?
      ws.send({type: 'result', result});
    });
  }

  gotResult() {
    this.waiting = false;
    if (this.state.pending.length) {
      this.enqueueSend();
    }
  }

  enqueueSend() {
    if (this.waiting) return;
    this.waiting = true;
    this.remote.send({
      type: 'addActions',
      data: {
        serverHead: this.state.serverHead,
        actions: this.state.pending,
      },
    });
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
    if (result.pending) {
      this.enqueueSend();
    }
    return true;
  }
}


