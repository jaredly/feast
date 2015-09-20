
import debug from 'debug';
const info = debug('sync:remote:info');
const warn = debug('sync:remote:warn');
const error = debug('sync:remote:error');

const pwait = time => new Promise(res => setTimeout(() => res(), time));

export default class FlakyProxy {
  constructor(remote) {
    this.remote = remote;
    this.connected = true;
  }

  connect() {
    this.connected = true;
  }

  disconnect() {
    this.connected = false;
  }

  async sync(data) {
    if (!this.connected) {
      throw new Error('No connection');
    }
    return this.remote.sync(data);
  }
}



