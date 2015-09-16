
import debug from 'debug';
const info = debug('sync:shared:info');
const warn = debug('sync:shared:warn');
const error = debug('sync:shared:error');

import * as handlers from './shared-handlers';
import ShallowShared from './ShallowShared';

export default class Shared extends ShallowShared {
  constructor(local, remote, rebaser) {
    super(rebaser);
    this.local = local;
    this.remote = remote;
    this.state = null;

    this.remote.on('message', ({type, data}) => {
      if (type === 'result') {
        return this.gotResult();
      }
      this.process(type, data);
    });
  }

  init() {
    return this.local.dump().then(({pending, data, serverHead}) => {
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
    });
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
    }).catch(err => error(err));
  }

  gotResult() {
    this.waiting = false;
    if (this.state.pending.length) {
      this.enqueueSend();
    }
  }

  enqueueSend() {
    if (this.waiting) return;
    this.waiting = true;
    this.remote.send({
      type: 'addActions',
      data: {
        serverHead: this.state.serverHead,
        actions: this.state.pending,
      },
    });
  }
}


