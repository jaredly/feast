
import Immutable from 'immutable';
import Socketeer from './Socketeer';

import defaultRebase from './defaultRebase';

export default class TabComm {
  constructor(port, reducers, rebase) {
    this.pending = [];
    this.serverState = null;
    this.syncedState = null;
    this.reducers = reducers;
    this.rebaseActions = rebase || defaultRebase;
    this.waiting = false;

    this.sock = new Socketeer({
      listen: fn => port.onmessage = evt => fn(evt.data),
      send: data => port.postMessage(data),
      breakSync: true,
    }, message => {
      // rebasing from the *server*
      if (message.type === 'rebase') {
        this.rebase(message, true);
      } else if (message.type === 'update') {
        this.rebase(message, false);
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
        this.syncedState = this.applyActions(this.syncedState, sending);
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
    console.log('REBASE', response, fromServer, this.serverState, this.syncedState, this.state)
    var base = fromServer ? this.serverState : this.syncedState;
    var syncedState = this.applyActions(base, response.newTail);
    this.syncedState = syncedState;
    if (fromServer) {
      this.serverState = syncedState;
    }
    var rebased = this.rebaseActions(this.pending, response.newTail, response.oldTail)
    this.state = this.applyActions(syncedState, rebased);
    this.pending = rebased;
    this.head = response.head;
    console.log('ESABER', this.serverState, this.syncedState, this.state);
  }

  addAction(action) {
    this.state = this.reducers(this.state, action);
    this.pending.push(action);

    if (!this.waiting) {
      this.sync();
    }
  }
}

