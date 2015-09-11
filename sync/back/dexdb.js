
import BaseDB from './basedb';

class LevelDB extends BaseDB {
  constructor(db, reduce) {
    super(reduce);
    this.db = db;
  }

  init() {
    all(this.db.createKeyStream()).then(keys => {
      if (!keys.length) {
        this.lastId = 0;
      } else {
        this.lastId = keys[keys.length - 1];
      }
    });
  }

  async getAllActions() {
    var items = await all(this.db.createReadStream());
    if (!items.length) {
      return {actions: [], head: 0};
    }
    return {
      actions: items.map(item => item.value),
      head: items[items.length - 1].key,
    };
  }

  getActionsSince(id) {
    if (id === this.lastId) {
      return Promise.resolve([]);
    }
    return all(this.db.createValueStream({gt: id}));
  }

  // it's important that the IDs are added correctly...
  addActions(actions) {
    var ops = actions.map(action => {
      this.lastId += 1;
      return {
        type: 'put',
        key: this.lastId,
        value: action,
      };
    });
    return prom(done => this.db.batch(ops, done));
  }
}

function prom(fn) {
  return new Promise((res, rej) =>
                     fn((err, val) =>
                        err ? rej(err) : res(val)));
}

function all(stream) {
  var vals = [];
  return prom(done => {
    stream.on('data', data => vals.push(data))
      .on('end', () => done(null, vals))
      .on('error', err => done(err));
  });
}

