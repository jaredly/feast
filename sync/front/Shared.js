
import * as handlers from './shared-handlers';

export default class Shared {
  constructor(ws, rebaser) {
    this.ws = ws;
    this.clients = [];
    this.fns = {rebaser};
    this.state = {
      serverHead: 0,
      pendingStart: 0,
      pending: [],
    };
    /*
    this.ws.on('message', ({type, data}) => {
      this.process(type, data);
    });
     */
  }

  addConnection(ws) {
    this.clients.push(ws);
    ws.on('message', ({type, data}) => {
      var result = this.process(type, data);
      // TODO give receipt messages?
      // ws.send({type: 'result', result});
    });
  }

  process(type, data) {
    console.log('shared process', type, data);
    var oldState = this.state;
    var result = handlers[type](this.state, this.fns, data);
    console.log(this.state, result);
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
    return true;
  }
}


