// @flow

import debug from 'debug';
import * as handlers from './tab-handlers';

const info = debug('sync:tab:info');
const warn = debug('sync:tab:warn');
const error = debug('sync:tab:error');

import type {Sender, Pendings, Remote, Local, Reducer, Rebaser, ClientState} from './types';

function makeRebaser<Action>(rebaser: Rebaser<Action>): Rebaser<Action> {
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

export default class Tab<State, Action> {
  state: ClientState<Action, State>;
  fns: {reducer: Reducer<State, Action>, rebaser: Rebaser<Action>};
  waiting: boolean;
  ws: Sender;
  _initwait: ?Promise<any>;
  _initpair: ?{res: () => void, rej: () => void};

  constructor(ws: Sender, reducer: Reducer<State, Action>, rebaser: Rebaser<Action>) {
    // State is initialized when a `dump` is received from the shared manager
    // $FlowFixMe
    this.state = null;
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

  async init(): Promise<void> {
    if (this.state) return;
    if (!this._initwait) {
      this._initwait = new Promise((res, rej) => {this._initpair = {res, rej}});
    }
    await this._initwait;
  }

  gotResult() {
    this.waiting = false;
    if (this.state.pending.length) {
      this.enqueueSend();
    }
  }

  addAction(action: Action) {
    this.process('addAction', {action});
  }

  enqueueSend() {
    if (this.waiting) return;
    this.waiting = true;
    this.ws.send({type: 'addActions', data: {
      actions: this.state.pending,
      serverHead: this.state.serverHead,
      sharedHead: this.state.sharedHead,
    }});
  }

  setState(state: ClientState<Action, State>) {
    this.state = state;
  }

  process(type: string, data: any): ?boolean {
    info('process', type, data);
    if (!handlers[type]) {
      return warn('no handler for', type, data);
    }
    var result = handlers[type](this.state, this.fns, data);
    info('tab process', this.state, result);
    if (!result) {
      return false;
    }
    if (!this.state && this._initpair) {
      this._initpair.res();
      this._initpair = null;
      this._initwait = null;
    }
    this.setState(result);
    if (result.pending.length) {
      this.enqueueSend();
    }

    return true;
  }
}

