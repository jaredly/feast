
import Socketback from './Socketback';

function invariant(check, message) {
  if (!check) throw new Error(message);
}

export default class SharedManager {
  // conn: connection to the server
  // db: the DB wrapper
  constructor(db, conn) {
    this.pending = [];
    this.lastPendingID = 0;
    this.head = 0;

    this.db = db;
    this.conn = conn;
    this._dumpCache = null;
    this.withLock = locker();
    this.clients = [];
  }

  addConnection(port) {
    var sack = new Socketback({
      listen: fn => port.onmessage = evt => fn(evt.data),
      send: data => port.postMessage(data),
    }, {
      dump: () => this.dump(),
      update: ({actions, head, serverHead}) => {
        if (serverHead !== this.head) {
          console.warn('got an update, but misaligned head. erroring out');
          throw new Error('Invalid head: ' + serverHead + ' expected ' + this.head);
        }
        if (head !== this.lastPendingID) {
          return {
            type: 'rebase',
            newTail: this.pending.slice(head - this.lastPendingID),
            head: this.lastPendingID,
            oldHead: head,
          };
        }
        this.addActions(actions);
        this.clients.forEach(other => {
          if (other === sack) return;
          sack.send({
            type: 'update',
            newTail: actions,
            head: this.lastPendingID,
            serverHead: this.head,
          });
        });
        return {
          type: 'sync',
          head: this.lastPendingID,
        };
      },
    });
    this.clients.push(sack);
    port.addEventListener('close', () => {
      var ix = this.clients.indexOf(sack);
      if (ix !== -1) {
        this.clients.splice(ix, 1);
      }
    });
  }

  dump() {
    // TODO initialize _dumpCache as just the loaded fresh data?
    if (this._dumpCache) {
      return Promise.resolve({data: this._dumpCache, serverHead: this.head, head: this.lastPendingID});
    }
    return this.db.dump().then(data => (this._dumpCache = data, {data, serverHead: this.head, head: this.lastPendingID}));
  }

  fresh() {
    return this.conn.dump().then(({data, head}) => {
      this.head = head;
      // TODO will this ever not be the same as "dump"?
      this._dumpCache = data;
      return Promise.all([
        this.db.setLatestSync(head, Date.now()),
        this.db.load(data),
      ]);
    });
  }

  init() {
    return Promise.all([
      this.db.getPendingActions(),
      this.db.getLatestSync(),
    ]).then(([pending, sync]) => {
      if (!sync) {
        invariant(!pending.length, "If there have been no syncs, nothing should have happened to make a pending action");
        return this.fresh();
      }

      this.lastPendingID = pending ? pending[pending.length - 1].id : 0;
      // this._sending = this.pending; this.pending = [];
      this.head = sync ? sync.head : 0;
      if (!pending) {
        return this.conn.poll(this.head).then(({actions, head, oldHead}) => {
          return this.processActions(actions);
        });
      }
      this.conn.update(this.head, pending).then(result => {
        if (!result.rebase) {
          // this isn't really the head yet.... but does that matter to the
          // tabs? I don't think so.
          this.head = result.head;
          return this.commitPending(pending, result.head);
        }
        var rebased = rebaseActions(pending, result.rebase);
        return this.processActions(rebased).then(() => {
          this.sendRebase(result.rebase.concat(rebased), pending);
        });
      });
    }).then(() => {
      this.enqueuePoll();
    });
  }

  commitPending(pending, head, lastId) {
    this.clients.forEach(client => client.send({type: 'sync', serverHead: head, head: lastId, actions: pending}));
    var start = lastId - pending.length + 1;
    return this.db.commitPending(pending.map((action, i) => ({id: start + i, action}))).then(() => {
      // TODO can I avoid resending this actions? Basically, if
      // [shared] here are my pendings, syncing...
      // [client] add another action to the mix!
      // [shared] ok tab, we're synced!
      // [client] but how far up are we synced?
      // this.clients.forEach(client => client.send({pending, synced: true}));
    });
  }

  sendRebase(newTail, oldTail) {
    this.clients.forEach(client => client.send({
      type: 'rebase',
      newTail,
      oldTail,
    }));
  }

  // TODO should I always wait? maybe not
  // actions gotten from the server....
  processActions(actions, head) {
    if (!actions.length) return Promise.resolve();
    this.clients.forEach(client => client.send({type: 'update', newTail: actions, head}));
    return this.db.applyActions(actions);
  }

  addAction(action) {
    this.pending.push(action);
    this.lastPendingID += 1;
    var id = this.lastPendingID;
    this.withLock(() => {
      this.db.addPending([{id, action}]);
    });
    this.enqueuePush();
  }

  addActions(actions) {
    this.pending = this.pending.concat(actions);
    var pending = actions.map((action, i) => ({id: this.lastPendingID + 1 + i, action}));
    this.db.addPending(pending);
    this.lastPendingID += actions.length;
    this.enqueuePush();
  }

  enqueuePush() {
    if (this._waiting) clearTimeout(this._waiting);
    if (this._pushwait) return;
    this._pushwait = setTimeout(() => this.withLock(() => {
      this._pushwait = null;
      var sending = this._sending = this.pending
      var lastId = this.lastPendingID;
      this.pending = [];
      return this.conn.update(this.head, sending).then(result => {
        if (!result.rebase) {
          // this isn't really the head yet.... but does that matter to the
          // tabs? I don't think so.
          this.head = result.head;
          return this.commitPending(sending, result.head, lastId);
        }
        var rebased = rebaseActions(sending, result.rebase);
        this.head = result.head;
        this.processActions(result.rebase, result.head);
        return this.processActions(actions).then(() => {
          this.sendRebase(result.rebase.concat(rebased), sending);
        });
      });
    }), this.pushTime);
  }

  enqueuePoll() {
    if (this._waiting || this._pushwait) return;
    this._waiting = setTimeout(() => {
      this.withLock(() => {
        this._waiting = null;
        return this.conn.poll(this.head).then(({actions, head, oldHead}) => {
          return this.processActions(actions);
        });
      });
    }, this.pollTime);
  }
}

function locker() {
  var queue = [];
  var busy = false;
  function next() {
    if (!queue.length) {
      return busy = false;
    }
    run(queue.shift());
  }
  function run(fn) {
    fn().then(next, err => {console.log('error in lock', err, err.stack); next()});
  }
  return function withLock(fn) {
    if (busy) return queue.push(fn);
    busy = true;
    run(fn);
  }
}

