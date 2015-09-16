
import * as handlers from './tab-handlers';

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
    this.ws = ws;
    this.ws.on('message', payload => {
      this.process(payload.type, payload.data);
    });
  }

  addAction(action) {
    this.process('addAction', {action});
  }

  enqueueSend(data) {
    this.ws.send({type: 'addActions', data});
  }

  process(type, data) {
    console.log('process', type, data);
    if (!handlers[type]) {
      return console.log('no handler for', type, data);
    }
    var result = handlers[type](this.state, this.fns, data);
    console.log(this.state, result);
    if (!result) {
      return false;
    }
    this.state = result;
    if (result.pending.length) {
      console.log('sending');
      this.enqueueSend({
        actions: result.pending,
        serverHead: result.serverHead,
        sharedHead: result.sharedHead,
      });
    }

    return true;
  }
}

