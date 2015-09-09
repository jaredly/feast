
import {expect} from 'chai';
import {EventEmitter} from 'events';
import {List} from 'immutable';

import Socketback from '../Socketback';
import Socketeer from '../Socketeer';
import prom from '../prom';

import SharedManager from '../SharedManager';
import TabComm from '../TabComm';

function tick(fn) {
  setTimeout(fn, 1);
}

var tickp = (val, time) => prom(done => setTimeout(() => done(null, val), time || 1));

var j = v => JSON.stringify(v);

function makePorts() {
  var one = {
    addEventListener: fn => {},
    postMessage: data => tick(() => console.log('\t\t\t\t\t\t\t\ts<<c', j(data)) && false || two.onmessage({data})),
    onmessage: () => {},
  };
  var two = {
    addEventListener: fn => {},
    postMessage: data => tick(() => console.log('\t\t\t\ts>>c', j(data)) && false || one.onmessage({data})),
    onmessage: () => {},
  };
  return [one, two];
}

function socketPair() {
  var front = new EventEmitter();
  var back = new EventEmitter();
  return {
    front: {
      listen: fn => front.on('message', fn),
      send: data => tick(() => back.emit('message', data)),
    },
    back: {
      listen: fn => back.on('message', fn),
      send: data => tick(() => front.emit('message', data)),
    },
  };
}

function make(onMessage, responders) {
    var {front, back} = socketPair();
    var seer = new Socketeer(front, onMessage);
    var sack = new Socketback(back, responders);
    return {seer, sack};
}

describe.only('AllYourBase', () => {
  it('should not fail utterly', done => {
    function reduce(state, action) {
      return state ? state.push(action) : new List();
    }

    var appliedActions = [];
    var serverActions = [];

    var db = {
      getPendingActions: () => [],
      getLatestSync: () => null,
      setLatestSync: () => null,
      commitPending: pending => {
        console.log('DB:commit', pending)
        appliedActions = appliedActions.concat(pending.map(p => p.action));
        return Promise.resolve(null)
      },
      addPending: pending => {
        console.log('\t\t\t\tDB:pending', pending);
        return Promise.resolve();
      },
      applyActions: actions => tickp(null, 10),
      load: () => null,
      dump: () => Promise.resolve([]),
    };
    var conn = {
      dump: () => {
        console.log('SS:dump');
        return Promise.resolve({data: [], head: 1000})
      },
      poll: head => {
        console.log('SS:poll');
        return Promise.resolve({actions: [], head, oldHead: head})
      },
      update: (head, sending) => {
        console.log('SS:update', head, sending);
        serverActions = serverActions.concat(sending);
        return tickp({head: head + sending.length}, 10)
      },
    };

    var shared = new SharedManager(db, conn);

    var [clientPort, sharedPort] = makePorts();
    var client = new TabComm(clientPort, reduce);
    shared.addConnection(sharedPort);

    shared.init().then(() => {
      return client.init().then(() => {
        client.addAction('a');
        client.addAction('b');
        client.addAction('c');
      });
    }).then(() => {
      setTimeout(() => {
        expect(client.state.toJS()).to.eql(['a', 'b', 'c']);
        expect(appliedActions).to.eql(['a', 'b', 'c']);
        expect(serverActions).to.eql(['a', 'b', 'c']);
        done();
      }, 200);
    }, err => {
      done(err);
    });
  });
});


