
import debug from 'debug';
const info = debug('sync:shared:info');
const warn = debug('sync:shared:warn');
const error = debug('sync:shared:error');

import * as handlers from './shared-handlers';

function makeRebaser(rebaser) {
  return (actions, prevTail, newTail) => {
    if (!prevTail) {
      if (actions.length && newTail.length && actions.length >= newTail.length && actions[0].id === newTail[0].id) {
        return actions.slice(newTail.length);
      }
      prevTail = [];
    }
    return rebaser(actions, prevTail, newTail);
  };
}

export default class ShallowShared {
  constructor(rebaser) {
    this.fns = {rebaser: makeRebaser(rebaser)};
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

  doAction(type, data) {
    info(this.id, 'process', type, data);
    var result = handlers[type](this.state, this.fns, data);
    if (!result) {
      info(this.id, 'no effect', this.state);
      return false;
    }
    info(this.id, 'result', this.state, result);
    this.state = result;
    return result;
  }

  process(type, data) {
    var oldState = this.state;
    var result = this.doAction(type, data);
    if (!result) return;

    // got add actions
    if (type === 'addActions') {
      this.sendSharedSync(result, oldState, data);
    }
    return true;
  }

  sendSharedSync(result, oldState, data) {
    this.clients.forEach(client => {
      client.send({
        type: 'sharedSync',
        data: {
          actions: data.actions,
          serverHead: result.serverHead,
          oldSharedHead: oldState.pendingStart + oldState.pending.length,
          newSharedHead: result.pendingStart + result.pending.length,
        },
      });
    });
  }
}



