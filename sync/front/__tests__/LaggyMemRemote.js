
import debug from 'debug';
const info = debug('sync:remote:info');
const warn = debug('sync:remote:warn');
const error = debug('sync:remote:error');

import MemRemote from '../../back/MemRemote';

const pwait = time => new Promise(res => setTimeout(() => res(), time));

export default class LaggyMemRemote extends MemRemote {
  constructor(reducer, actions, time) {
    super(reducer, actions);
    this.waitTime = time || 5;
  }

  async getActionsBetween(first, second) {
    await pwait(this.waitTime);
    var i1 = -1, i2 = -1;
    if (first !== null) {
      i1 = this.ids.indexOf(first);
      if (i1 === -1) {
        error('Unknown get actions between', first, second);
        throw new Error('Invalid action range');
      }
    }
    if (second !== null) {
      i2 = this.ids.indexOf(second);
      if (i2 === -1) {
        error('Unknown get actions between', first, second);
        throw new Error('Invalid action range');
      }
    }
    info('getting actions', first, i1, second, i2, this.ids)
    if (i1 === -1 || i2 === -1) {
    }
    return this.actions.slice(i1 + 1, i2 + 1);
  }

  async addActions(actions) {
    await pwait(this.waitTime);
    this.actions = this.actions.concat(actions);
    this.ids = this.ids.concat(actions.map(a => a.id));
  }
}

