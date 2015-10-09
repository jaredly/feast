
import debug from 'debug';
const info = debug('sync:remote:info');
const warn = debug('sync:remote:warn');
const error = debug('sync:remote:error');

import MemRemote from '../../back/MemRemote';

const pwait = time => new Promise(res => setTimeout(() => res(), time));

export default class DisconnectedMemRemote extends MemRemote {
  constructor(reducer, actions) {
    super(reducer, actions);
    this.connected = true;
  }

  async sync(data) {
    if (!this.connected) {
      throw new Error('No connection');
    }
    return super.sync(data);
  }
}


