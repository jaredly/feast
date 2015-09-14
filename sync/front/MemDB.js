/* @flow */

import type {Reducer, Sync, Pending, SharedDB} from './types';

export default class MemDB<State, Action> {
  reduce: Reducer<State, Action>;
  latestSync: ?Sync;
  pending: {[key: string]: Pending};
  state: ?State;

  constructor(reduce: Reducer<State, Action>) {
    this.reduce = reduce;
    this.latestSync = null;
    this.pending = {};
    this.state = null;
  }

  async getPendingActions(): Promise<Array<Action>> {
    return Object.keys(this.pending).map(id => this.pending[id]);
  }

  async getLatestSync(): Promise<?Sync> {
    return this.latestSync;
  }

  async setLatestSync(sync: Sync): Promise<void> {
    this.latestSync = sync;
  }

  async commitPending(pending: Array<Pending>): Promise<void> {
    this.applyActions(pending.map(p => p.action));
    this.removePending(pending);
  }

  async applyActions(actions: Array<Action>): Promise<void> {
    this.state = actions.reduce(this.reduce, this.state);
  }

  async applyAction(action: Action): Promise<void> {
    this.state = this.reduce(this.state, action);
  }

  async addPending(pending: Array<Pending>): Promise<void> {
    pending.forEach(p => {
      this.pending[p.id] = p;
    });
  }

  async removePending(pending: Array<Pending>): Promise<void> {
    pending.forEach(p => {
      delete this.pending[p.id];
    });
  }

  async load(data: ?State): Promise<void> {
    if (data) {
      this.state = data;
    }
  }

  async dump(): Promise<?State> {
    return this.state;
  }
}

