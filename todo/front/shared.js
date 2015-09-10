
import SharedManager from '../../sync/front/SharedManager';
import db from './db';

class DBMiddle {
  constructor(db) {
    invariant(db.meta, 'The Dexie schema must contain a "meta" collection');
    invariant(db.pending, 'The Dexie schema must contain a "pending" collection');
    this.db = db;
  }

  // *** COMMON THINGS (potentially) ***
  getLatestSync() {
    return this.db.meta.get('sync');
  }

  setLatestSync(head, time) {
    return this.db.meta.set({head, time, id: 'sync'}, 'sync');
  }

  commitPending(pending) {
    return Promise.all([this.applyActions(pending.map(p => p.action)), this.removePending(pending)]);
  }

  applyActions(actions) {
    // TODO figure out what things can be done concurrently
    // var actions = compressActions(pending.map(p => p.action));
    // actions.reduce((prom, actions) => prom.then(() => this.applyActionParallel(actions)));
    return actions.reduce((prom, action) => {
      return prom.then(() => this.applyAction(action));
    }, Promise.resolve());
  }

  applyAction(action) {
    return actions[action.type].db(this.db, action);
  }

  /* unused yet
  applyActionsParallel(actions) {
    return Promise.all(actions.map(action => this.applyAction(action)));
  }
  */

  addPending(pending) {
    return Promise.all(pending.map(p => this.db.pending.put(p)));
  }

  removePending(pending) {
    // TODO do between (lowest, highest), b/c they are totally ordered. Right?
    return this.db.pending.where(':id').anyOf(pending.map(p => p.id)).delete();
  }

  // **** DOMAIN SPECIFIC ****

  // this is where you need knowledge of the DB setup.
  load(data) {
    var ops = [];
    for (var id in data.items) {
      ops.push(this.db.items.put(data.items[id]));
    }
    return Promise.all(ops);
  }

  // inverse of load, really
  dump() {
    return this.db.items.toArray(items => items.reduce((data, item) => {
      data[item.id] = item;
      return data;
    }, {}));
  }
}

var dbMid = new DBMiddle(db);
var conn = new APITalker('http://localhost:9019');
var shared = new SharedManager(db, conn);

var pending = shared.init();

onconnect = function (e) {
  var port = e.ports[0];
  port.start();

  // send over initial data to tab
  pending.then(() => shared.dump()).then(data => post.postMessage(data));

  shared.addConnection({
    listen(fn) {
      port.addEventListener('message', (e) => fn(e.data));
    },
    send(data) {
      port.postMessage(data);
    }
  });
}

