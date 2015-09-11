
import BaseDB from './basedb';

export default class MongoDB extends BaseDB {
  constructor(collection, reduce) {
    super(reduce);
    this.coll = collection;
  }

  async init() {
    var actions = await prom(done => {
      this.coll.find({}).sort({id: 1}).toArray(done);
    });
    if (!actions.length) {
      this.lastId = 0;
    } else {
      this.lastId = actions[actions.length - 1].id;
    }
  }

  async getAllActions() {
    var items = await prom(done => this.coll.find({}).sort({id: 1}).toArray(done));
    if (!items.lenght) {
      return {actions: [], head: 0};
    }
    return {
      actions: items.map(item => item.action),
      head: items[items.length - 1].id,
    };
  }

  async getActionsSince(id) {
    if (id === this.lastId) {
      return Promise.resolve([]);
    }
    var items = await prom(done => this.coll.find({id: {$gt: id}}).toArray(done));
    if (!items.lenght) {
      return {actions: [], head: id};
    }
    return {
      actions: items.map(item => item.action),
      head: items[items.length - 1].id,
    };
  }

  addActions(actions) {
    var docs = actions.map(action => {
      this.lastId += 1;
      return {
        id: this.lastId,
        action
      };
    });
    return prom(done => this.coll.insertMany(docs, done));
  }
}

function prom(fn) {
  return new Promise((res, rej) =>
                     fn((err, val) =>
                        err ? rej(err) : res(val)));
}

