
import Immutable from 'immutable';
import Socketeer from './Socketeer';

export default class TabComm {
  constructor(port, reducers) {
    this.pending = [];
    this.serverState = null;
    this.syncedState = null;
    this.reducers = reducers;
    this.waiting = false;

    this.sock = new Socketeer({
      listen: fn => port.onmessage = evt => fn(evt.data),
      send: data => port.postMessage(data),
    }, message => {
      // rebasing from the *server*
      if (message.type === 'rebase') {
        this.rebase(response, true);
      } else if (message.type === 'update') {
        this.rebase(response, false);
      } else if (message.type === 'sync') {
        this.serverState = this.applyActions(this.serverState, message.actions);
        this.serverHead = message.serverHead;
      }
    });
  }

  applyActions(state, actions) {
    return actions.reduce(this.reducers, state);
  }

  init() {
    return this.sock.send('dump').then(({head, serverHead, data}) => {
      var state = Immutable.fromJS(data);
      this.head = head;
      this.serverHead = serverHead;
      this.serverState = state;
      this.syncedState = state;
      this.state = state;
    });
  }

  sync() {
    var sending = this.pending;
    this.sending = sending;
    this.pending = [];
    this.waiting = this.sock.send('update', {
      actions: sending,
      head: this.head,
      serverHead: this.serverHead,
    }).then(response => {
      if (response.type !== 'rebase') {
        this.head = response.head;
      } else {
        this.sending = null;
        this.pending = sending.concat(this.pending);
        this.rebase(response, false);
      }
      this.waiting = false;
      if (this.pending.length) {
        this.sync();
      }
    }).catch(err => {
      console.log('failed to sync', err);
    });
  }

  rebase(response, fromServer) {
    var base = fromServer ? this.serverState : this.syncedState;
    var syncedState = this.applyActions(base, response.newTail);
    this.syncedState = syncedState;
    if (fromServer) {
      this.serverState = syncedState;
    }
    var rebased = rebaseActions(this.pending, response.newTail, response.oldTail)
    this.state = this.applyActions(syncedState, rebased);
    this.pending = rebased;
    this.head = response.head;
  }

  addAction(action) {
    this.state = this.reducers(this.state, action);
    this.pending.push(action);

    if (!this.waiting) {
      this.sync();
    }
  }
}

