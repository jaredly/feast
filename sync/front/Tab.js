
import debug from 'debug';
import * as handlers from './tab-handlers';

const info = debug('sync:tab:info');
const error = debug('sync:tab:error');

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

export default class Tab {
  constructor(ws, reducer, rebaser) {
    this.state = {
      server: null,
      shared: null,
      local: null,
      serverHead: 0,
      sharedHead: 0,
      pending: [],
    };
    this.fns = {reducer, rebaser: makeRebaser(rebaser)};
    this.waiting = false;
    this.ws = ws;
    this.ws.on('message', payload => {
      if (payload.type === 'result') {
        return this.gotResult();
      }
      this.process(payload.type, payload.data);
    });
  }

  gotResult() {
    this.waiting = false;
    if (this.state.pending.length) {
      this.enqueueSend();
    }
  }

  addAction(action) {
    this.process('addAction', {action});
  }

  enqueueSend(data) {
    if (this.waiting) return;
    this.waiting = true;
    this.ws.send({type: 'addActions', data: {
      actions: this.state.pending,
      serverHead: this.state.serverHead,
      sharedHead: this.state.sharedHead,
    }});
  }

  process(type, data) {
    info('process', type, data);
    if (!handlers[type]) {
      return warn('no handler for', type, data);
    }
    var result = handlers[type](this.state, this.fns, data);
    info(this.state, result);
    if (!result) {
      return false;
    }
    this.state = result;
    if (result.pending.length) {
      this.enqueueSend();
    }

    return true;
  }
}

