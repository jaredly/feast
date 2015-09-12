
import chalk from 'chalk';
import {expect} from 'chai';
import {EventEmitter} from 'events';
import {List, fromJS} from 'immutable';

import Socketback from '../Socketback';
import Socketeer from '../Socketeer';
import prom from '../prom';

import SharedManager from '../SharedManager';
import TabComm from '../TabComm';
import MemDB from '../MemDB';
import RemoteMemDB from '../../back/db';

import {tick, rtick, tickp, makePorts, make, makeTracking, basicDb, basicConn} from './utils';

chalk.enabled = true;

function immSimple(state, action) {
  if (!state) state = new List();
  return state.push(action.name);
}

function mutSimple(state, action) {
  if (!state) state = [];
  state.push(action.name);
  return state;
}

function immReduce(state, action) {
  if (!state) state = fromJS({num: 0, actions: []});
  var num = state.get('num');
  if (action.type === 'add') {
    num += action.num;
  } else if (action.type === 'mul') {
    num *= action.num;
  }
  return state.set('num', num).updateIn(['actions'], a => a.concat([action]));
}

function mutReduce(state, action) {
  if (!state) state = {num: 0, actions: []};
  if (action.type === 'add') {
    state.num += action.num;
  } else if (action.type === 'mul') {
    state.num *= action.num;
  }
  state.actions.push(action);
  return state;
}

function makeTab(name, reduce, shared, random) {
  var [clientPort, sharedPort] = makePorts(name, random);
  var client = new TabComm(clientPort, reduce);
  shared.addConnection(sharedPort);
  return client;
}

describe('Multiple SharedManagers', () => {
  it('should work', done => {

    var db = new MemDB(mutReduce);

    var remoteDB = new RemoteMemDB(mutReduce);
    var shared = new SharedManager(db, remoteDB);

    var [clientPort, sharedPort] = makePorts('one');
    var client = new TabComm(clientPort, immReduce);
    shared.addConnection(sharedPort);

    shared.init().then(() => client.init()).then(() => {
      client.addAction({type: 'add', num: 10});
      client.addAction({type: 'mul', num: 5});
      client.addAction({type: 'add', num: 2});
    }).then(() => setTimeout(() => {
      expect(db.state.num).to.equal(52, 'local db');
      expect(client.state.get('num')).to.equal(52, 'client state');
      remoteDB.dump().then(({data, head}) => {
        expect(data.num).to.equal(52, 'remote db')
        done();
      }).catch(done);
    }, 150)).catch(done);
  });

  it('should handle multiple shared managers', done => {
    var remoteDB = new RemoteMemDB(mutReduce);

    var db = new MemDB(mutReduce);
    var shared = new SharedManager(db, remoteDB);

    var db2 = new MemDB(mutReduce);
    var shared2 = new SharedManager(db2, remoteDB);

    var [clientPort, sharedPort] = makePorts('one');
    var client = new TabComm(clientPort, immReduce);
    shared.addConnection(sharedPort);

    var [clientPort2, sharedPort2] = makePorts('two');
    var client2 = new TabComm(clientPort2, immReduce);
    shared2.addConnection(sharedPort2);

    shared.init().then(() => client.init())
    shared2.init().then(() => client2.init()).then(() => {
      client.addAction({type: 'add', num: 10});
      client2.addAction({type: 'mul', num: 5});
      client.addAction({type: 'add', num: 2});
    }).then(() => setTimeout(() => {
      var value = db.state.num;
      expect(client.state.get('num')).to.equal(value, 'client state');
      expect(db2.state.num).to.equal(value, 'local db 2');
      expect(client2.state.get('num')).to.equal(value, 'client state 2');
      remoteDB.dump().then(({data, head}) => {
        expect(data.num).to.equal(value, 'remote db')
        done();
      }).catch(done);
    }, 1250)).catch(done);
  });

  /****************************
   * Here's the setup
   *
   *          Remote
   *          |     |
   *    Shared1     Shared2
   *    |     |     |     |
   *   Tab1  Tab2  Tab3  Tab4
   *
   ****************************/
  it('should handle mutlple shared managers and multiple tabs', done => {
    var remoteDB = new RemoteMemDB(mutSimple);

    var db1 = new MemDB(mutSimple);
    var shared1 = new SharedManager(db1, remoteDB, null, 100);
    var tab1 = makeTab('one', immSimple, shared1);
    var tab2 = makeTab('two', immSimple, shared1);

    var db2 = new MemDB(mutSimple);
    var shared2 = new SharedManager(db2, remoteDB, null, 100);
    var tab3 = makeTab('three', immSimple, shared2);
    var tab4 = makeTab('four', immSimple, shared2);

    var tabs = [tab1, tab2, tab3, tab4];

    Promise.all(
      [shared1, shared2, tab1, tab2, tab3, tab4].map(c => c.init())
    ).then(() => {
      tab1.addAction({name: 'hello'});
      tab4.addAction({name: 'world'});
    }).then(() => setTimeout(() => {
      var goalState = ['hello', 'world'];
      tabs.forEach(tab => {
        expect(tab.state.toJS()).to.eql(goalState);
      });
      expect(db1.state).to.eql(goalState);
      remoteDB.dump().then(({data, head}) => {
        expect(data).to.eql(goalState);
        done();
      }).catch(done);
    }, 200)).catch(done);
  });

  it('Offline-saved startup', done => {
    var remoteDB = new RemoteMemDB(mutSimple);

    var db1 = new MemDB(mutSimple);
    var shared1 = new SharedManager(db1, remoteDB, null, 100);
    var tab1 = makeTab('one', immSimple, shared1);

    Promise.all([
      remoteDB.addActions([
        {name: 'remote-1'},
        {name: 'remote-2'}
      ]),
      db1.addPending([
        {id: 10, action: {name: 'db1-pending-1'}},
        {id: 11, action: {name: 'db1-pending-2'}},
      ]),
      db1.setLatestSync({head: 0}),
    ]).then(() => Promise.all([
      shared1.init(),
      tab1.init(),
    ])).then(() => setTimeout(() => {
      var truth = ['remote-1', 'remote-2', 'db1-pending-1', 'db1-pending-2'];
      remoteDB.dump().then(({data, head}) => {
        expect(tab1.state.toJS()).to.eql(truth);
        expect(db1.state).to.eql(truth);
        expect(data).to.eql(truth);
        done();
      }).catch(done);
    }, 200)).catch(done);
  });

  it.only('All the rebasing without concurrent startup, pretty much', done => {
    var remoteDB = new RemoteMemDB(mutSimple);

    var db1 = new MemDB(mutSimple);
    var shared1 = new SharedManager(db1, remoteDB, null, 100);
    var tab1 = makeTab('one', immSimple, shared1);
    var tab2 = makeTab('two', immSimple, shared1);

    var db2 = new MemDB(mutSimple);
    var shared2 = new SharedManager(db2, remoteDB, null, 100);
    var tab3 = makeTab('three', immSimple, shared2);
    var tab4 = makeTab('four', immSimple, shared2);

    var tabs = [tab1, tab2, tab3, tab4];

    shared1.id = chalk.red('shared1');
    shared2.id = chalk.green('shared2');
    tab1.id = chalk.yellow('tab1');
    tab2.id = chalk.red('tab2');
    tab3.id = chalk.blue('tab3');
    tab4.id = chalk.green('tab4');

    // seed the databases
    Promise.all([
      remoteDB.addActions([
        {name: 'remote-1'},
        {name: 'remote-2'}
      ]),
      db1.addPending([
        {id: 10, action: {name: 'db1-pending-1'}},
        {id: 11, action: {name: 'db1-pending-2'}},
      ]),
      db1.setLatestSync({head: 0}),
      db2.addPending([
        {id: 30, action: {name: 'db2-pending-1'}},
        {id: 31, action: {name: 'db2-pending-2'}},
      ]),
      db2.setLatestSync({head: 0}),
    ]).then(() => Promise.all(
      [shared1.init(), shared2.init()]
    )).then(() => tabs.map(c => c.init())).then(() => {
      // tabs.forEach((tab, i) => tab.addAction({name: 'tab' + i + '-1'}));
      // tabs.forEach((tab, i) => tab.addAction({name: 'tab' + i + '-2'}));
    }).then(() => setTimeout(() => {
      remoteDB.dump().then(({data, head}) => {
        var goalState = data;
        console.log('Goal state', data);
        expect(db1.state).to.eql(goalState, 'db1');
        expect(db2.state).to.eql(goalState, 'db2');
        tabs.forEach((tab, i) => {
          expect(tab.state.toJS()).to.eql(goalState, 'tab check ' + i);
        });
        done();
      }).catch(done);
    }, 500)).catch(done);
  });

  it.skip('All the rebasing, pretty much', done => {
    var remoteDB = new RemoteMemDB(mutSimple);

    var db1 = new MemDB(mutSimple);
    var shared1 = new SharedManager(db1, remoteDB, null, 100);
    var tab1 = makeTab('one', immSimple, shared1);
    var tab2 = makeTab('two', immSimple, shared1);

    var db2 = new MemDB(mutSimple);
    var shared2 = new SharedManager(db2, remoteDB, null, 100);
    var tab3 = makeTab('three', immSimple, shared2);
    var tab4 = makeTab('four', immSimple, shared2);

    var tabs = [tab1, tab2, tab3, tab4];

    // seed the databases
    Promise.all([
      remoteDB.addActions([
        {name: 'remote-1'},
        {name: 'remote-2'}
      ]),
      db1.addPending([
        {id: 10, action: {name: 'db1-pending-1'}},
        {id: 11, action: {name: 'db1-pending-2'}},
      ]),
      db1.setLatestSync({head: 0}),
      db2.addPending([
        {id: 30, action: {name: 'db2-pending-1'}},
        {id: 31, action: {name: 'db2-pending-2'}},
      ]),
      db2.setLatestSync({head: 0}),
    ]).then(() => Promise.all(
      [shared1, shared2, tab1, tab2, tab3, tab4].map(c => c.init())
    )).then(() => {
      tabs.forEach((tab, i) => tab.addAction({name: 'tab' + i + '-1'}));
      tabs.forEach((tab, i) => tab.addAction({name: 'tab' + i + '-2'}));
    }).then(() => setTimeout(() => {
      remoteDB.dump().then(({data, head}) => {
        var goalState = data;
        tabs.forEach(tab => {
          expect(tab.state.toJS()).to.eql(goalState);
        });
        expect(db1.state).to.eql(goalState);
        expect(db2.state).to.eql(goalState);
        done();
      }).catch(done);
    }, 200)).catch(done);
  });
});

