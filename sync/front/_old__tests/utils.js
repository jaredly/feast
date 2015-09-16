
import {List} from 'immutable';

import Socketback from '../Socketback';
import Socketeer from '../Socketeer';
import prom from '../prom';

import SharedManager from '../SharedManager';

export function tick(fn) {
  setTimeout(fn, 10);
}

export function rtick(fn, offset) {
  setTimeout(fn, 5 + Math.floor(offset));
}

var start = Date.now();
export var tickp = (val, time) => prom(done => setTimeout(() => done(null, val), time || 1));

var j = v => JSON.stringify(v);

export function makePorts(name, random) {
  var ticker = random ? rtick : tick;
  var count = 0;
  var one = {
    addEventListener: fn => {},
    postMessage: data => ticker(() => {
      console.log('\t\t\t\t\t\t\t\ts<<c', name, data.type, j(data), Date.now() - start);
      return two.onmessage({data});
    }, count += Math.random() / 5),
    onmessage: () => {},
  };
  var two = {
    addEventListener: fn => {},
    postMessage: data => ticker(() => {
      console.log('\t\t\t\ts>>c', name, data.type, j(data), Date.now() - start);
      one.onmessage({data});
    }, ++count),
    onmessage: () => {},
  };
  return [one, two];
}

export function make(onMessage, responders) {
    var {front, back} = socketPair();
    var seer = new Socketeer(front, onMessage);
    var sack = new Socketback(back, responders);
    return {seer, sack};
}

export function makeTracking() {
  var serverActions = [];
  var appliedActions = [];

  var db = {
    ...basicDb,
    applyActions: pending => {
      console.log('DB:apply', pending)
      appliedActions.push(...pending);
      return Promise.resolve(null)
    },
  };
  var remote = {
    ...basicRemote,
    tryAddActions: (sending, head) => {
      console.log('SS:update', head, sending);
      serverActions.push(...sending);
      return tickp({head: head + sending.length}, 10)
    },
  };

  var shared = new SharedManager(db, remote);
  return {serverActions, appliedActions, shared};
}

export var basicDb = {
  getPendingActions: () => [],
  getLatestSync: () => null,
  setLatestSync: () => null,
  addPending: pending => {
    console.log('\t\t\t\tDB:pending', pending);
    return Promise.resolve();
  },
  commitPending(pending) {
    return Promise.all([this.applyActions(pending.map(p => p.action)), this.removePending(pending)]);
  },
  applyActions: actions => tickp(null, 10),
  removePending: () => null,
  load: () => null,
  dump: () => Promise.resolve([]),
};

export var basicRemote = {
  dump: () => {
    console.log('SS:dump');
    return Promise.resolve({data: [], head: 1000})
  },
  getActionsSince: head => {
    console.log('SS:poll');
    return Promise.resolve({actions: [], head, oldHead: head})
  },
  tryAddActions: (head, sending) => tickp({head: head + sending.length}, 10),
};

export function reduce(state, action) {
  return state ? state.push(action) : new List();
}

