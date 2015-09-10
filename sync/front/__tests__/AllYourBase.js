
import chalk from 'chalk';
import {expect} from 'chai';
import {EventEmitter} from 'events';
import {List} from 'immutable';

import Socketback from '../Socketback';
import Socketeer from '../Socketeer';
import prom from '../prom';

import SharedManager from '../SharedManager';
import TabComm from '../TabComm';

chalk.enabled = true;

function tick(fn) {
  setTimeout(fn, 10);
}

function rtick(fn, offset) {
  var times = [10, 23, 13, 16, 18, 10, 11, 10, 14];
  setTimeout(fn, times[offset % times.length]);
  // setTimeout(fn, Math.floor(Math.random() * 10 + 10));
}

var tickp = (val, time) => prom(done => setTimeout(() => done(null, val), time || 1));

var j = v => JSON.stringify(v);

function makePorts(name, random) {
  var ticker = random ? rtick : tick;
  var count = 0;
  var one = {
    addEventListener: fn => {},
    postMessage: data => ticker(() => console.log('\t\t\t\t\t\t\t\ts<<c', name, data.type, j(data)) && false || two.onmessage({data}), ++count),
    onmessage: () => {},
  };
  var two = {
    addEventListener: fn => {},
    postMessage: data => ticker(() => console.log('\t\t\t\ts>>c', name, data.type, j(data)) && false || one.onmessage({data}), ++count),
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

function makeTracking() {
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
  var conn = {
    ...basicConn,
    update: (head, sending) => {
      console.log('SS:update', head, sending);
      serverActions.push(...sending);
      return tickp({head: head + sending.length}, 10)
    },
  };

  var shared = new SharedManager(db, conn);
  return {serverActions, appliedActions, shared};
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

    var [clientPort, sharedPort] = makePorts('one');
    var client = new TabComm(clientPort, reduce);
    shared.addConnection(sharedPort);

    shared.init().then(() => client.init()).then(() => {
      client.addAction('a');
      client.addAction('b');
      client.addAction('c');
    }).then(() => {
      setTimeout(() => {
        expect(client.pending).to.eql([]);
        expect(client.state.toJS()).to.eql(['a', 'b', 'c'], 'client state');
        expect(serverActions).to.eql(['a', 'b', 'c'], 'sent to server');
        expect(appliedActions).to.eql(['a', 'b', 'c'], 'applied to db');
        done();
      }, 100);
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

    var [clientPort, sharedPort] = makePorts('one');
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

    var [clientPort, sharedPort] = makePorts('one');
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

  it('should reconcile a rebase from another tab', done => {
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

    var [clientPort, sharedPort] = makePorts(chalk.yellow('FIRST'));
    var client = new TabComm(clientPort, reduce);
    shared.addConnection(sharedPort);

    var [clientPort2, sharedPort2] = makePorts(chalk.red('SECOND'));
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
    var {serverActions, appliedActions, shared} = makeTracking();

    var [clientPort, sharedPort] = makePorts(chalk.yellow('FIRST'));
    var client = new TabComm(clientPort, reduce);
    shared.addConnection(sharedPort);

    var [clientPort2, sharedPort2] = makePorts(chalk.red('SECOND'));
    var client2 = new TabComm(clientPort2, reduce);
    shared.addConnection(sharedPort2);

    shared.init().then(() => Promise.all([client.init(), client2.init()])).then(() => {
      client2.addAction('first thing');
      client.addAction('second thing');
    }).then(() => setTimeout(() => {
      expect(client2.state.toJS()).to.eql(['first thing', 'second thing'], 'second client state');
      expect(client.state.toJS()).to.eql(['first thing', 'second thing'], 'first client state');
      expect(serverActions).to.eql(['first thing', 'second thing'], 'sent to server');
      expect(appliedActions).to.eql(['first thing', 'second thing'], 'db applied');
      done();
    }, 450));
  });

  it('should reconcile a complex (time-crossing + random latency) rebase from another tab', done => {
    var {serverActions, appliedActions, shared} = makeTracking();

    var [clientPort, sharedPort] = makePorts(chalk.yellow('FIRST'), true);
    var client = new TabComm(clientPort, reduce);
    shared.addConnection(sharedPort);

    var [clientPort2, sharedPort2] = makePorts(chalk.red('SECOND'), true);
    var client2 = new TabComm(clientPort2, reduce);
    shared.addConnection(sharedPort2);

    shared.init().then(() => Promise.all([client.init(), client2.init()])).then(() => {
      client2.addAction('first thing');
      client.addAction('second thing');
    }).then(() => setTimeout(() => {
      expect(appliedActions).to.eql(serverActions, 'db should match server');
      expect(client2.state.toJS()).to.eql(serverActions, 'second client state should match server');
      expect(client.state.toJS()).to.eql(serverActions, 'first client state should match server');
      done();
    }, 450));
  });

  it('lots of tab rebasing (deterministic)', done => {
    var {serverActions, appliedActions, shared} = makeTracking();
    const colors = ['red', 'green', 'blue', 'gray', 'yellow'];

    let clients = [];
    for (var i=0; i<10; i++) {
      const [clientPort, sharedPort] = makePorts(chalk[colors[i % colors.length]]('client' + i));
      const client = new TabComm(clientPort, reduce);
      shared.addConnection(sharedPort);
      clients.push(client);
    }

    shared.init().then(() => Promise.all(clients.map(c => c.init()))).then(() => {
      clients.forEach((c, i) => c.addAction('first from ' + i));
      clients.forEach((c, i) => c.addAction('second from ' + i));
    }).then(() => setTimeout(() => {
      console.log('SERVER', serverActions);
      expect(appliedActions).to.eql(serverActions, 'applied actions should equal server actions');
      clients.forEach((c, i) => {
        expect(c.state.toJS()).to.eql(serverActions, 'client ' + i + ' state should equal server actions');
      });
      done();
    }, 600));
  });

  it('tab rebase fuzzing (random  latency)', done => {
    var {serverActions, appliedActions, shared} = makeTracking();
    const colors = ['red', 'green', 'blue', 'gray', 'yellow'];

    let clients = [];
    for (var i=0; i<10; i++) {
      const [clientPort, sharedPort] = makePorts(chalk[colors[i % colors.length]]('client' + i), true);
      const client = new TabComm(clientPort, reduce);
      shared.addConnection(sharedPort);
      clients.push(client);
    }

    shared.init().then(() => Promise.all(clients.map(c => c.init()))).then(() => {
      clients.forEach((c, i) => c.addAction('first from ' + i));
      clients.forEach((c, i) => c.addAction('second from ' + i));
    }).then(() => setTimeout(() => {
      console.log('SERVER', serverActions);
      expect(appliedActions).to.eql(serverActions, 'applied actions should equal server actions');
      var errs = [];
      clients.forEach((c, i) => {
        var cer = checks([
          () => expect(c.head).to.eql(shared.lastPendingID, 'Client ' + i + ' head === lastPendingID'),
          () => expect(c.serverHead).to.eql(shared.head, 'Client ' + i + ' serverHead === shared.head'),
          () => expect(c.state.toJS()).to.eql(c.syncedState.toJS(), 'client ' + i + ' state == syncedState'),
          () => expect(c.state.toJS()).to.eql(c.serverState.toJS(), 'client ' + i + ' state == serverState'),
          () => expect(c.state.toJS()).to.eql(serverActions, 'client ' + i + ' state should equal server actions'),
        ])
        if (cer.length) {
          console.log('Client', i, 'failed', cer);
          errs.push(...cer);
        }
      });
      console.log(clients.length - errs.length, 'Clients succeeded', errs.length, 'failed');
      if (errs.length) {
        throw errs[0];
      }
      done();
    }, 600));
  });
});


function checks(fns) {
  var errs = [];
  fns.forEach(fn => {try {fn()} catch (e) {errs.push(e)}});
  return errs;
}

