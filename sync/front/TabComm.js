
import Immutable from 'immutable';
import Socketeer from './Socketeer';

import prom from './prom';
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
      this.state = state; console.log('init', state);
    }).catch(err => {
      return prom(done => setTimeout(() => done(), 200))
        .then(() => this.init());
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
      this.sending = null;
      if (response.type !== 'rebase') {
        this.head = response.head;
        this.syncedState = this.applyActions(this.syncedState, sending);
      } else {
        this.pending = sending.concat(this.pending);
        this.rebase(response, false);
      }
      this.waiting = false;
      if (this.pending.length) {
        this.sync();
      }
    }).catch(err => {
      console.log('failed to sync', err);
      this.waiting = false;
      if (this.sending) {
        this.pending = this.sending.concat(this.pending);
      }
      this.sync();
    });
  }

  rebase(response, fromServer) {
    if (response.head <= this.head) {
      return console.error('REBASE INVALID', this.head, response);
    }
    // console.log('REBASE', response, fromServer, this.serverState, this.syncedState, this.state, this.pending, this.sending)
    var base = fromServer ? this.serverState : this.syncedState;
    var syncedState = this.applyActions(base, response.newTail);
    this.syncedState = syncedState;
    if (fromServer) {
      this.serverState = syncedState;
    }
    // a sync was interrupted
    if (this.sending) {
      this.pending = this.sending.concat(this.pending);
      this.sending = null;
    }
    var rebased = this.rebaseActions(this.pending, response.newTail, response.oldTail)
    this.state = this.applyActions(syncedState, rebased);
    this.pending = rebased;
    this.head = response.head;
    // console.log('ESABER server', this.serverState, 'synced', this.syncedState, 'state', this.state, 'pending', this.pending, 'sending', this.sending);
  }

  addAction(action) {
    this.state = this.reducers(this.state, action); console.log('add action', this.state);
    this.pending.push(action);

    if (!this.waiting) {
      this.sync();
    }
  }
}

