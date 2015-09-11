
export default class MemDB {
  constructor(reduce) {
    this.reduce = reduce;
    this.latestSync = null;
    this.pending = {};
    this.state = null;
  }

  async getPendingActions() {
    return Object.keys(this.pending).map(id => this.pending[id]);
  }

  async getLatestSync() {
    return this.latestSync;
  }

  async setLatestSync(sync) {
    this.latestSync = sync;
  }

  async commitPending(pending) {
    this.applyActions(pending.map(p => p.action));
    this.removePending(pending);
  }

  async applyActions(actions) {
    actions.map(action => this.applyAction(action));
  }

  async applyAction(action) {
    this.state = this.reduce(this.state, action);
  }

  async addPending(pending) {
    pending.forEach(p => {
      this.pending[p.id] = p;
    });
  }

  async removePending(pending) {
    pending.forEach(p => {
      delete this.pending[p.id];
    });
  }

  async load(data) {
    if (data) {
      this.state = data;
    }
  }

  async dump() {
    return this.state;
  }
}

