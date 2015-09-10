
import {expect} from 'chai';
import {EventEmitter} from 'events';
import {List} from 'immutable';

import Socketback from '../Socketback';
import Socketeer from '../Socketeer';
import prom from '../prom';

import SharedManager from '../SharedManager';
import TabComm from '../TabComm';

function tick(fn) {
  setTimeout(fn, 10);
}

var tickp = (val, time) => prom(done => setTimeout(() => done(null, val), time || 1));

var j = v => JSON.stringify(v);

function makePorts(name) {
  var one = {
    addEventListener: fn => {},
    postMessage: data => tick(() => console.log('\t\t\t\t\t\t\t\ts<<c', name, j(data)) && false || two.onmessage({data})),
    onmessage: () => {},
  };
  var two = {
    addEventListener: fn => {},
    postMessage: data => tick(() => console.log('\t\t\t\ts>>c', name, j(data)) && false || one.onmessage({data})),
    onmessage: () => {},
  };
  return [one, two];
}

function make(onMessage, responders) {
    var {front, back} = socketPair();
    var seer = new Socketeer(front, onMessage);
    var sack = new Socketback(back, responders);
    return {seer, sack};
}

var basicDb = {
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

var basicConn = {
  dump: () => {
    console.log('SS:dump');
    return Promise.resolve({data: [], head: 1000})
  },
  poll: head => {
    console.log('SS:poll');
    return Promise.resolve({actions: [], head, oldHead: head})
  },
  update: (head, sending) => tickp({head: head + sending.length}, 10),
};

function reduce(state, action) {
  return state ? state.push(action) : new List();
}

describe('AllYourBase', () => {
  it('should not fail utterly', done => {

    var appliedActions = [];
    var serverActions = [];

    var db = {
      ...basicDb,
      commitPending: pending => {
        console.log('DB:commit', pending)
        appliedActions = appliedActions.concat(pending.map(p => p.action));
        return Promise.resolve(null)
      },
    };

    var conn = {
      ...basicConn,
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

    shared.init().then(() => client.init()).then(() => {
      client.addAction('a');
      client.addAction('b');
      client.addAction('c');
    }).then(() => {
      setTimeout(() => {
        expect(client.state.toJS()).to.eql(['a', 'b', 'c'], 'client state');
        expect(appliedActions).to.eql(['a', 'b', 'c'], 'applied to db');
        expect(serverActions).to.eql(['a', 'b', 'c'], 'sent to server');
        done();
      }, 50);
    }, err => {
      done(err);
    });
  });

  it('should propagate a change from Tab to Server', done => {
    var serverActions = [];
    var conn = {
      ...basicConn,
      update: (head, sending) => {
        console.log('SS:update', head, sending);
        serverActions = serverActions.concat(sending);
        return tickp({head: head + sending.length}, 10)
      },
    };
    var shared = new SharedManager(basicDb, conn);

    var [clientPort, sharedPort] = makePorts();
    var client = new TabComm(clientPort, reduce);
    shared.addConnection(sharedPort);

    shared.init().then(() => client.init()).then(() => {
      client.addAction('something');
    }).then(() => setTimeout(() => {
      expect(serverActions).to.eql(['something'], 'sent to server');
      done();
    }, 50));
  });

  it('should reconcile a rebase from the server', done => {
    var serverActions = [];
    var appliedActions = [];

    var db = {
      ...basicDb,
      applyActions: pending => {
        console.log('DB:apply', pending)
        appliedActions = appliedActions.concat(pending);
        return Promise.resolve(null)
      },
    };
    var conn = {
      ...basicConn,
      update: (head, sending) => {
        if (head === 1000) {
          return tickp({head: head + 1, rebase: ['thisfirst']})
        }
        console.log('SS:update', head, sending);
        serverActions = serverActions.concat(sending);
        return tickp({head: head + sending.length}, 10)
      },
    };
    var shared = new SharedManager(db, conn);

    var [clientPort, sharedPort] = makePorts();
    var client = new TabComm(clientPort, reduce);
    shared.addConnection(sharedPort);

    shared.init().then(() => client.init()).then(() => {
      client.addAction('something');
    }).then(() => setTimeout(() => {
      expect(client.state.toJS()).to.eql(['thisfirst', 'something'], 'client state');
      expect(serverActions).to.eql(['something'], 'sent to server');
      expect(appliedActions).to.eql(['thisfirst', 'something'], 'applied to db');
      done();
    }, 50));
  });

  it.only('should reconcile a rebase from another tab', done => {
    var serverActions = [];
    var appliedActions = [];

    var db = {
      ...basicDb,
      applyActions: pending => {
        console.log('DB:apply', pending)
        appliedActions = appliedActions.concat(pending);
        return Promise.resolve(null)
      },
    };
    var conn = {
      ...basicConn,
      update: (head, sending) => {
        console.log('SS:update', head, sending);
        serverActions = serverActions.concat(sending);
        return tickp({head: head + sending.length}, 10)
      },
    };

    var shared = new SharedManager(db, conn);

    var [clientPort, sharedPort] = makePorts('FIRST');
    var client = new TabComm(clientPort, reduce);
    shared.addConnection(sharedPort);

    var [clientPort2, sharedPort2] = makePorts('SECOND');
    var client2 = new TabComm(clientPort2, reduce);
    shared.addConnection(sharedPort2);

    shared.init().then(() => Promise.all([client.init(), client2.init()])).then(() => {
      client2.addAction('first thing');
    }).then(() => {
      return prom(done => setTimeout(() => {
        client.addAction('second thing');
        done();
      }, 100));
    }).then(() => setTimeout(() => {
      expect(serverActions).to.eql(['first thing', 'second thing'], 'server state');
      expect(appliedActions).to.eql(['first thing', 'second thing'], 'db actions');

      expect(client.state.toJS()).to.eql(['first thing', 'second thing'], 'first client state');
      expect(client2.state.toJS()).to.eql(['first thing', 'second thing'], 'second client state');
      done();
    }, 450));
  });

  it('should reconcile a complex (time-crossing) rebase from another tab', done => {
    var serverActions = [];
    var appliedActions = [];

    var db = {
      ...basicDb,
      applyActions: pending => {
        console.log('DB:apply', pending)
        appliedActions = appliedActions.concat(pending);
        return Promise.resolve(null)
      },
    };
    var conn = {
      ...basicConn,
      update: (head, sending) => {
        console.log('SS:update', head, sending);
        serverActions = serverActions.concat(sending);
        return tickp({head: head + sending.length}, 10)
      },
    };

    var shared = new SharedManager(db, conn);

    var [clientPort, sharedPort] = makePorts('FIRST');
    var client = new TabComm(clientPort, reduce);
    shared.addConnection(sharedPort);

    var [clientPort2, sharedPort2] = makePorts('SECOND');
    var client2 = new TabComm(clientPort2, reduce);
    shared.addConnection(sharedPort2);

    shared.init().then(() => Promise.all([client.init(), client2.init()])).then(() => {
      client2.addAction('first thing');
      client.addAction('second thing');
    }).then(() => setTimeout(() => {
      expect(client2.state.toJS()).to.eql(['first thing', 'second thing'], 'second client state');
      expect(client.state.toJS()).to.eql(['first thing', 'second thing'], 'first client state');
      // expect(serverActions).to.eql(['something'], 'sent to server');
      // expect(appliedActions).to.eql(['thisfirst', 'something'], 'applied to db');
      done();
    }, 450));
  });
});


