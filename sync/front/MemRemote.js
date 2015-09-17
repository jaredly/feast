
import debug from 'debug';
const info = debug('sync:remote:info');
const warn = debug('sync:remote:warn');
const error = debug('sync:remote:error');

import Remote from './Remote';

export default class MemRemote extends Remote {
  constructor(actions) {
    super();
    this.actions = actions || [];
    this.ids = this.actions.map(a => a.id);
    this.head = this.ids.length ? this.ids[this.ids.length - 1] : null;
  }

  async getActionsBetween(first, second) {
    var i1 = first === null ? 0 : this.ids.indexOf(first);
    var i2 = second === null ? 0 : this.idx.indexOf(second);
    if (i1 === -1 || i2 === -1) {
      error('Unknown get actions between', first, second);
      throw new Error('Invalid action range');
    }
    return this.actions.slice(i1 + 1, i2 + 1);
  }

  async addActions(actions) {
    this.actions = this.actions.concat(actions);
    this.ids = this.ids.concat(actions.map(a => a.id));
  }
}

