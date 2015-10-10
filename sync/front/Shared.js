/* @flow */

import debug from 'debug';
const info = debug('sync:shared:info');
const warn = debug('sync:shared:warn');
const error = debug('sync:shared:error');

import chalk from 'chalk';
import * as handlers from './shared-handlers';
import ShallowShared from './ShallowShared';
debugger;

import type {Sender, Pendings, Remote, Local, Rebaser, SharedState} from './types';

export default class Shared<Action> extends ShallowShared {
  local: Local<Action>;
  remote: Remote<Action>;
  state: SharedState<Action>;
  pollTime: number;
  id: string;
  _poll: ?number | bool;

  constructor(local: Local<Action>, remote: Remote<Action>, rebaser: Rebaser<Action>, pollTime: number) {
    // $FlowFixMe
    super(rebaser);
    this.local = local;
    this.remote = remote;
    // $FlowFixMe
    this.state = null;
    this.pollTime = pollTime || 1000;
    this.id = Math.random().toString(16).slice(2);
  }

  async init(): Promise<void> {
    let {pending, data, serverHead} = await this.local.dump();
    if (serverHead === false) {
      const result = await this.remote.dump();
      info(this.id, 'got remote dump', result);
      data = result.data;
      serverHead = result.serverHead;
      this.local.setDump({data, serverHead, pending}).catch(err => {
        console.error('failed to set dump', err);
      });
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
    if (this.remote.onExtra) {
      this.remote.onExtra(data => {
        try {
          this.process('serverSync', data);
        } catch (e) {
          console.warn('FAIL remote server sync extra', e, e.stack, data);
          this.sync();
        }
      });
    }
    if (this.remote.onDisconnect) {
      this.remote.onDisconnect(() => {
        this.startPolling();
      });
    }
    this.sync();
  }

  // If a sync request fails, poll until it works.
  startPolling() {
    info(this.id, chalk.red('start polling'), !!this._poll);
    if (!this._poll) {
      this._poll = setTimeout(this.sync.bind(this), this.pollTime);
    }
  }

  initConnection(ws: Sender) {
    this.local.dumpData().then(({serverHead, data}) => {
      if (serverHead !== this.state.serverHead) {
        warn('Trying to initialize a connection, and there is too much traffick... trying again', serverHead, this.state.serverHead);
        console.log('server head off', serverHead, this.state.serverHead);
        return setTimeout(() => this.initConnection(ws), 50);
      }
      ws.send({type: 'dump', data: {
        server: data,
        serverHead,
        sharedActions: this.state.pending,
        sharedHead: this.state.pendingStart + this.state.pending.length,
      }});
    }).catch(err => {
      console.log('dump failed', err);
      error('FAIL in connection init', err, err.stack)
    });
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
      this.process('serverSync', data);
    }, err => {
      error('FAIL syncing', err, err.stack)
      this._poll = null;
      this.startPolling();
    }).then(
      () => {},
      err => {
        error('FAIL processing sync', err, err.stack)
        // the issue was probably a bad serverHead
        setTimeout(() => {
          this.sync();
        }, 10);
      }
    );
  }

  process(type: string, data: any): ?boolean {
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
      // TODO: throttle this?
      this.sync();
    }
    return true;
  }

  sendServerSync(result: SharedState<Action>, oldState: SharedState<Action>, data: {actions: Pendings<Action>}) {
    this.clients.forEach(client => {
      client.send({
        type: 'serverSync',
        data: {
          serverActions: data.actions,
          oldServerHead: oldState.serverHead,
          newServerHead: result.serverHead,
          oldSharedActions: oldState.pending,
          newSharedActions: result.pending,
          oldSharedHead: oldState.pendingStart + oldState.pending.length,
          newSharedHead: result.pendingStart + result.pending.length,
        },
      });
    });
  }
}

