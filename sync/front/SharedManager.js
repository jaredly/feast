
import Socketback from './Socketback';

import defaultRebase from './defaultRebase';

function invariant(check, message) {
  if (!check) throw new Error(message);
}

const gen = () => Math.random().toString(16).slice(2);

export default class SharedManager {
  // remote: remote database
  // db: the DB wrapper
  constructor(db, remote, rebase, pollTime) {
    this.id = gen();
    this.pending = [];
    this.lastPendingID = 0;
    this.head = 0;

    this.rebaseActions = rebase || defaultRebase;
    this.db = db;
    this.remote = remote;
    this._dumpCache = null;
    this.withLock = locker();
    this.clients = [];
    this.pollTime = pollTime || 1000;
    this.initprom = new Promise((res, rej) => this.initfns = {res, rej});
    this.initialized = false;
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
          throw new Error('Invalid head in "update" request from a client: ' + serverHead + ' expected ' + this.head);
        }
        if (head !== this.lastPendingID) {
          return {
            type: 'rebase',
            newTail: this.pending.slice(head - this.lastPendingID).map(p => p.action),
            head: this.lastPendingID,
            oldHead: head,
          };
        }
        this.addActions(actions);
        this.clients.forEach(other => {
          if (other === sack) return;
          // TODO have some knowledge of the where the client's head is, so we
          // won't send redundent updates (e.g. if the client sent and update
          // and got a rebase with this action.... but wait, maybe this would
          // actually never happen b/c sends are ordered? idk. I think the
          // randomness might be approximating multi-process things, but it's
          // also likely that there are some ordering guarantees that I'm
          // invalidating w/ the randomness. Anyway.
          other.send({
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

  async dump() {
    if (this.initprom) {
      await this.initprom();
    }
    return this.db.dump().then(data => ({
      data,
      serverHead: this.head,
      head: this.lastPendingID
    }));
  }

  fresh() {
    return this.remote.dump().then(({data, head}) => {
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
        return this.remote.getActionsSince(this.head).then(({actions, head, oldHead}) => {
          return this.processActions(actions);
        });
      }
      var sending = this._sending = pending;
      var actions = sending.map(p => p.action);
      var lastId = this.lastPendingID;
      this.pending = [];
      return this.remote.tryAddActions(actions, this.head).then(result => {
        // {head:, rebase:}
        if (!result.rebase) {
          // this isn't really the head yet.... but does that matter to the
          // tabs? I don't think so. FIXME this might be wrong - we send this
          // as serverHead to the tabs :/ ?
          this.head = result.head;
          return this.commitPending(sending, result.head, lastId);
        }

        var rebased = this.rebaseActions(actions, result.rebase);
        this.head = result.head;
        this.pending = rebased
          .map((action, i) => ({action, id: sending[i].id}))
          .concat(this.pending);
        return this.db.applyActions(result.rebase).then(() => {
          return this.sendRebase(result.rebase.concat(rebased), actions);
        }).then(() => this.doPush()); // push the now rebased pendings
      });
    }).then(() => {
      this._pushwait = null;
      if (this.pending.length) {
        this.enqueuePush();
      } else {
        this.enqueuePoll();
      }
      this.initfns.res();
      this.initprom = null;
      this.initfns = null;
    }, err => {
      this.initfns.rej(err);
      this.initprom = null;
      this.initfns = null;
    });
  }

  commitPending(pending, head, lastId) {
    // TODO can I avoid resending this actions? Basically, if
    // [shared] here are my pendings, syncing...
    // [client] add another action to the mix!
    // [shared] ok tab, we're synced!
    // [client] but how far up are we synced?
    // this.clients.forEach(client => client.send({pending, synced: true}));
    this.clients.forEach(client => client.send({
      type: 'sync',
      serverHead: head,
      head: lastId,
      actions: pending.map(p => p.action)
    }));
    return this.db.commitPending(pending);
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
    this.lastPendingID += 1;
    this.pending.push({id: lastPendingID, action});
    var id = this.lastPendingID;
    this.withLock(() => {
      this.db.addPending([{id, action}]);
    });
    this.enqueuePush();
  }

  addActions(actions) {
    var pending = actions.map((action, i) => ({id: this.lastPendingID + 1 + i, action}));
    this.pending = this.pending.concat(pending);
    this.db.addPending(pending);
    this.lastPendingID += actions.length;
    this.enqueuePush();
  }

  enqueuePush() {
    if (this._waiting) clearTimeout(this._waiting);
    this._waiting = null;
    if (this._pushwait) return;
    this._pushwait = setTimeout(() => this.withLock(() => {
      return this.doPush();
    }), this.pushTime);
  }

  doPush() {
    var sending = this._sending = this.pending
    var actions = sending.map(p => p.action);
    var lastId = this.lastPendingID;
    this.pending = [];
    return this.remote.tryAddActions(actions, this.head).then(result => {
      console.log(this.id, 'push, updating', this.head, sending, result);
      if (!result.rebase) {
        // this isn't really the head yet.... but does that matter to the
        // tabs? I don't think so.
        this.head = result.head;
        return this.commitPending(sending, result.head, lastId);
      }
      var rebased = this.rebaseActions(actions, result.rebase);
      this.head = result.head;
      this.pending = rebased
        .map((action, i) => ({action, id: sending[i].id}))
        .concat(this.pending);
      return this.db.applyActions(result.rebase).then(() => {
        return this.sendRebase(result.rebase.concat(rebased), actions);
      }).then(() => this.doPush()); // push the now rebased pendings
    }).then(() => {
      this._pushwait = null;
      if (this.pending.length) {
        this.enqueuePush();
      } else {
        this.enqueuePoll();
      }
    });
  }

  enqueuePoll() {
    if (this._waiting || this._pushwait) return;
    console.log(this.id, 'POLL');
    this._waiting = setTimeout(() => {
      this.withLock(() => {
        this._waiting = null;
        return this.remote.getActionsSince(this.head)
        .then(({actions, head, oldHead}) => {
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
    fn().then(next, err => {console.log(this.id, 'error in lock', err, err.stack); next()});
  }
  return function withLock(fn) {
    if (busy) return queue.push(fn);
    busy = true;
    run(fn);
  }
}

