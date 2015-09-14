/* @flow */

import Socketback from './Socketback';

import defaultRebase from './defaultRebase';

import type {RemoteDB, SharedDB, Pending, Reducer, Sync} from './types';

type Rebaser = any;
type Port = any;

function invariant(check, message) {
  if (!check) throw new Error(message);
}

var gen = () => Math.random().toString(16).slice(2);

export default class SharedManager<State, Action> {
  id: string;
  pending: Array<Pending<Action>>;
  lastPendingID: number;
  head: number;
  rebaseActions: Rebaser;
  db: SharedDB<State, Action>;
  remote: RemoteDB<State, Action>;
  _dumpCache: ?State;
  withLock: (fn: () => any) => void;
  clients: Array<any>;
  pollTime: number;
  initprom: ?Promise<void>;
  initialized: boolean;
  initfns: ?{res: () => void, rej: (err: Error) => void};
  _pushwait: ?number;
  _waiting: ?number;
  _sending: ?Array<Pending<Action>>;
  pushTime: number;

  // remote: remote database
  // db: the DB wrapper
  constructor(db: SharedDB, remote: RemoteDB, rebase: ?Rebaser, pollTime: ?number) {
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
    this.pushTime = 10;
    // $FlowFixMe
    this.initprom = new Promise((res, rej) => this.initfns = {res, rej});
    this.initialized = false;
  }

  addConnection(port: Port) {
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

  // $FlowFixMe why don't you understand!!
  async dump(): Promise<{data: State, serverHead: number, head: number}> {
    if (this.initprom) {
      await this.initprom;
    }
    return this.db.dump().then(data => ({
      data,
      serverHead: this.head,
      head: this.lastPendingID
    }));
  }

  fresh(): Promise<any> {
    // $FlowFixMe flow is confused :/
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

  init(): Promise<any> {
    return Promise.all([
      this.db.getPendingActions(),
      this.db.getLatestSync(),
      // $FlowFixMe tuple promise not understood
    ]).then(([pending, sync]: [Array<Pending<Action>>, ?Sync]) => {
      if (!sync) {
        invariant(!pending.length, "If there have been no syncs, nothing should have happened to make a pending action");
        return this.fresh();
      }

      this.lastPendingID = pending ? +pending[pending.length - 1].id : 0;
      // this._sending = this.pending; this.pending = [];
      this.head = sync ? sync.head : 0;
      if (!pending) {
        return this.remote.getActionsSince(this.head).then(({actions, head}) => {
          return this.processActions(actions, this.lastPendingID);
        });
      }
      var sending = this._sending = pending;
      var actions = sending.map(p => p.action);
      var lastId = this.lastPendingID;
      this.pending = [];
      return this.remote.tryAddActions(actions, this.head).then(result => {
        // {head:, rebase:}
        if (result.type === 'sync') {
          // this isn't really the head yet.... but does that matter to the
          // tabs? I don't think so. FIXME this might be wrong - we send this
          // as serverHead to the tabs :/ ?
          this.head = result.head;
          return this.commitPending(sending, result.head, lastId);
        }

        var rebased = this.rebaseActions(actions, result.rebase);
        var oldHead = this.head;
        this.head = result.head;
        this.pending = rebased
          .map((action, i) => ({action, id: sending[i].id}))
          .concat(this.pending);
        return this.db.applyActions(result.rebase).then(() => {
          // $FlowFixMe this is unreachable if result.type === 'sync'
          return this.sendRebase(result.rebase.concat(rebased), actions, oldHead, result.head);
        }).then(() => this.doPush()); // push the now rebased pendings
      });
    }).then(() => {
      this._pushwait = null;
      if (this.pending.length) {
        this.enqueuePush();
      } else {
        this.enqueuePoll();
      }
      if (this.initfns) this.initfns.res();
      this.initprom = null;
      this.initfns = null;
    }, err => {
      if (this.initfns) this.initfns.rej(err);
      this.initprom = null;
      this.initfns = null;
      console.log(this.id, 'INIT FAILED', err);
      throw err;
    });
  }

  commitPending(pending: Array<Pending<Action>>, head: number, lastId: number): Promise<void> {
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

  sendRebase(newTail: Array<Action>, oldTail: Array<Action>, oldHead: number, newHead: number) {
    this.clients.forEach(client => client.send({
      type: 'rebase',
      newTail,
      oldTail,
      newHead,
      oldHead,
      head: this.lastPendingID,
    }));
  }

  // TODO should I always wait? maybe not
  // actions gotten from the server....
  processActions(actions: Array<Action>, head: number) {
    if (!actions.length) return Promise.resolve();
    this.clients.forEach(client => client.send({type: 'rebase', newTail: actions, oldTail: [], head, serverHead: this.head}));
    return this.db.applyActions(actions);
  }

  addAction(action: Action) {
    this.lastPendingID += 1;
    this.pending.push({id: '' + this.lastPendingID, action});
    var id = this.lastPendingID;
    this.withLock(() => {
      this.db.addPending([{id: '' + id, action}]);
    });
    this.enqueuePush();
  }

  addActions(actions: Array<Action>) {
    var pending = actions.map((action, i) => ({id: this.lastPendingID + 1 + i + '', action}));
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

  doPush(): Promise<void> {
    var sending = this._sending = this.pending
    var actions = sending.map(p => p.action);
    var lastId = this.lastPendingID;
    this.pending = [];
    return this.remote.tryAddActions(actions, this.head).then(result => {
      console.log(this.id, 'push, updating', this.head, sending, result);
      if (result.type === 'sync') {
        // this isn't really the head yet.... but does that matter to the
        // tabs? I don't think so.
        this.head = result.head;
        return this.commitPending(sending, result.head, lastId);
      }
      var rebased = this.rebaseActions(actions, result.rebase);
      var oldHead = this.head;
      this.head = result.head;
      this.pending = rebased
        .map((action, i) => ({action, id: sending[i].id}))
        .concat(this.pending);
      return this.db.applyActions(result.rebase).then(() => {
        // $FlowFixMe this is unreachable if result.type === 'sync'
        return this.sendRebase(result.rebase.concat(rebased), actions, oldHead, result.head);
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
        .then(({actions, head}) => {
          console.log(this.id, 'poll result', this.head, actions, head);
          this.head = head;
          return this.processActions(actions, this.lastPendingID);
        }).then(() => this.enqueuePoll());
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

