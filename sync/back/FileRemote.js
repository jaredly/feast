
import debug from 'debug';
const info = debug('sync:remote:info');
const warn = debug('sync:remote:warn');
const error = debug('sync:remote:error');

import fs from 'fs';
import Remote from './Remote';

export default class FileRemote extends Remote {
  constructor(reducer, path) {
    super(reducer);
    this._path = path;
    this._load();
    this._stream = fs.createWriteStream(path, {flags: 'a'});
    this.ids = this.actions.map(a => a.id);
    this.head = this.ids.length ? this.ids[this.ids.length - 1] : null;
  }

  // TODO async?
  _load() {
    try {
      fs.statSync(this._path);
    } catch (e) {
      this.actions = [];
      return;
    }
    this.actions = fs.readFileSync(this._path)
      .toString('utf8')
      .split(/\n/g)
      .filter(n => n.trim())
      .map(line => JSON.parse(line));
  }

  async getActionsBetween(first, second) {
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
    info('Adding actions', actions);
    this.actions = this.actions.concat(actions);
    this.ids = this.ids.concat(actions.map(a => a.id));
    actions.forEach(action => this._stream.write(JSON.stringify(action) + '\n'))
  }
}


