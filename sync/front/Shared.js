
import debug from 'debug';
const info = debug('sync:shared:info');
const warn = debug('sync:shared:warn');
const error = debug('sync:shared:error');

import chalk from 'chalk';
import * as handlers from './shared-handlers';
import ShallowShared from './ShallowShared';

export default class Shared extends ShallowShared {
  constructor(local, remote, rebaser, pollTime) {
    super(rebaser);
    this.local = local;
    this.remote = remote;
    this.state = null;
    this.pollTime = pollTime || 1000;
    this.id = Math.random().toString(16).slice(2);
  }

  async init() {
    let {pending, data, serverHead} = await this.local.dump();
    if (serverHead === false) {
      const result = await this.remote.dump();
      data = result.data;
      serverHead = result.serverHead;
      this.local.setDump({data, serverHead, pending});
    }
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
    this.startPolling();
  }

  startPolling() {
    info(this.id, chalk.red('start polling'), this._poll);
    if (!this._poll) {
      this._poll = setTimeout(this.sync.bind(this), this.pollTime);
    }
  }

  initConnection(ws) {
    this.local.dumpData().then(({serverHead, data}) => {
      if (serverHead !== this.state.serverHead) {
        warn('Trying to initialize a connection, and there is too much traffick... trying again', serverHead, this.state.serverHead);
        return this.initConnection(ws);
      }
      ws.send({type: 'dump', data: {
        server: data,
        serverHead,
        sharedActions: this.state.pending,
        sharedHead: this.state.pendingStart + this.state.pending.length,
      }});
    }).catch(err => error('FAIL in connection init', err));
  }

  clearPoll() {
    clearTimeout(this._poll);
    this._poll = null;
  }

  sync() {
    info(this.id, 'sync', this.state.pending, this.state.serverHead);
    clearTimeout(this._poll);
    this._poll = true;
    var sending = this.state.pending;
    this.remote.sync({
      actions: this.state.pending,
      serverHead: this.state.serverHead,
    }).then(data => {
      info(this.id, 'sync result', data);
      this._poll = null;
      if (!data.actions) {
        data.actions = sending;
      }
      info(this.id, 'onprocess');
      this.process('serverSync', data);
      this.startPolling();
    }).catch(err => error('FAIL syncing', err));
  }

  process(type, data) {
    var oldState = this.state;
    var result = this.doAction(type, data);
    if (!result) return;

    // server rebase
    if (type === 'serverSync' && result.serverHead != oldState.serverHead) {
      if (data.rebase) {
        this.local.addActions(data.actions, result.serverHead);
      } else {
        this.local.commitPending(data.actions, result.serverHead);
      }
      this.sendServerSync(result, oldState, data);
      if (data.rebase) {
        this.sync();
      }
    }

    // got add actions
    if (type === 'addActions') {
      this.local.addPending(data.actions);
      this.sendSharedSync(result, oldState, data);
    }
    return true;
  }

  sendServerSync(result, oldState, data) {
    this.clients.forEach(client => {
      client.send({
        type: 'remoteSync',
        data: {
          remoteActions: data.actions,
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
}

