
import LaggyMemRemote from '../LaggyMemRemote';
import MemRemote from '../MemRemote';
import Shared from '../Shared';
import Tab from '../Tab';

import {pit, pwait, pcheck, prom, fakeDb, socketPair, laggySocketPair, randomSocketPair, checkUntil} from './helpers';
import {expect} from 'chai';
import chalk from 'chalk';


function rebaser(actions, oldTail, newTail) {
  return actions.map(({id, action: {name}}) => ({id, action: {name: name + '+'}}));
}

function reducer(state, {action}) {
  if (!state) state = {names: []};
  return {names: state.names.concat([action.name])};
}


describe('Shared.js', () => {
  pit('should initialize a tab', async () => {
    var remote = new MemRemote(reducer);
    var db = fakeDb(reducer, {names: ['woah']}, 1, [{id: 'theid', action: {name: 'awesome'}}]);
    var shared = new Shared(db, remote);

    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    await Promise.all([shared.init(), tab.init()]);
    expect(tab.state.local).to.eql({names: ['woah', 'awesome']});
  });

  pit('should initialize after added', async () => {
    var remote = new MemRemote(reducer);
    var db = fakeDb(reducer, {names: ['woah']}, 1, [{id: 'theid', action: {name: 'awesome'}}]);
    var shared = new Shared(db, remote);

    await shared.init();

    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    await tab.init();

    expect(tab.state.local).to.eql({names: ['woah', 'awesome']});
  });

  pit('should play well with tab adding action', async () => {
    var remote = new MemRemote(reducer);
    var db = fakeDb(reducer, {names: ['woah']}, 1, [{id: 'theid', action: {name: 'awesome'}}]);
    var shared = new Shared(db, remote);

    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    await Promise.all([shared.init(), tab.init()]);
    tab.addAction({name: 'new'});
    tab.addAction({name: 'thing'});
    await pwait(100);
    var goal = {names: ['woah', 'awesome', 'new', 'thing']}
    expect(tab.state.local).to.eql(goal, 'tab local');
    expect(shared.state.pending.reduce(reducer, tab.state.server)).to.eql(goal, 'shared state');
  });

  pit('should sync to remote', async () => {
    var remote = new MemRemote(reducer, [{id: 'first', action: {name: 'thefirst'}}]);
    var db = fakeDb(reducer, null, false);
    var shared = new Shared(db, remote, rebaser, 1);

    await shared.init();
    await pwait(2);

    expect(shared.state.serverHead).to.equal('first', 'shared serverHead');
    expect((await db.dumpData()).data).to.eql({names: ['thefirst']}, 'db dump');
  });

  pit('should sync a remote w/ pending', async () => {
    var remote = new MemRemote(reducer, [{id: 'first', action: {name: 'thefirst'}}]);
    var db = fakeDb(reducer, null, null, [{
      id: 'second',
      action: {name: 'thesecond'},
    }]);
    var shared = new Shared(db, remote, rebaser, 1);

    await shared.init();
    await pwait(2);

    expect(shared.state.serverHead).to.equal('second');
    expect((await db.dumpData()).data).to.eql({names: ['thefirst', 'thesecond+']}, 'db dump');
  });

  pit('two shared sync', async () => {
    var remote = new MemRemote(reducer, [{id: 'first', action: {name: 'thefirst'}}]);

    var db1 = fakeDb(reducer, null, null, [{id: 'second', action: {name: 'thesecond'}}]);
    var shared1 = new Shared(db1, remote, rebaser, 1);
    shared1.id = 'shared1'

    var db2 = fakeDb(reducer, null, null, [{id: 'third', action: {name: 'thethird'}}]);
    var shared2 = new Shared(db2, remote, rebaser, 1);
    shared2.id = 'shared2'

    await shared1.init();
    await shared2.init();
    await pwait(20);

    shared1.clearPoll();
    shared2.clearPoll();

    expect(shared1.state.serverHead).to.equal(remote.head, 'shared1 head');
    expect(shared2.state.serverHead).to.equal(remote.head, 'shared2 head');
    var goalData = remote.actions.reduce(reducer, null);
    expect((await db1.dumpData()).data).to.eql(goalData);
    expect((await db2.dumpData()).data).to.eql(goalData);
  });

  pit('two shared sync - w/ lag', async () => {
    var remote = new LaggyMemRemote(reducer, [{id: 'first', action: {name: 'thefirst'}}], 5);

    var db1 = fakeDb(reducer, null, null, [{id: 'second', action: {name: 'thesecond'}}]);
    var shared1 = new Shared(db1, remote, rebaser, 2);
    shared1.id = chalk.blue('shared1')

    var db2 = fakeDb(reducer, null, null, [{id: 'third', action: {name: 'thethird'}}]);
    var shared2 = new Shared(db2, remote, rebaser, 2);
    shared2.id = chalk.green('shared2')

    await Promise.all([shared1.init(), shared2.init()]);
    await pwait(50);

    shared1.clearPoll();
    shared2.clearPoll();

    expect(shared1.state.serverHead).to.equal(remote.head, 'shared1 head');
    expect(shared2.state.serverHead).to.equal(remote.head, 'shared2 head');
    var goalData = remote.actions.reduce(reducer, null);
    expect((await db1.dumpData()).data).to.eql(goalData, 'db1 data');
    expect((await db2.dumpData()).data).to.eql(goalData, 'db2 data');
  });

  pit('full stack tab -> shared -> remote', async () => {
    var remote = new MemRemote(reducer, []);
    var db = fakeDb(reducer, null, false);
    var shared = new Shared(db, remote, rebaser, 10);

    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    await shared.init();
    tab.addAction({name: 'hello'});

    await pwait(100);

    expect(shared.state.serverHead).to.equal(remote.head, 'shared serverHead');
    expect(tab.state.serverHead).to.equal(remote.head, 'tab serverHead');

    var goalData = remote.actions.reduce(reducer, null);
    expect(tab.state.local).to.eql(goalData, 'tab-local');
    expect(tab.state.shared).to.eql(goalData, 'tab-shared');
    expect(tab.state.server).to.eql(goalData, 'tab-server');
    expect((await db.dumpData()).data).to.eql(goalData, 'db dump');
    // remote -> shared (db) -> tab
  });


  pit('full stack sync', async () => {
    var remote = new MemRemote(reducer, [{id: 'first', action: {name: 'thefirst'}}]);
    var db = fakeDb(reducer, null, false);
    var shared = new Shared(db, remote, rebaser, 1);

    await shared.init();
    await pwait(2);

    expect(shared.state.serverHead).to.equal('first', 'shared serverHead');
    expect((await db.dumpData()).data).to.eql({names: ['thefirst']}, 'db dump');
    // remote -> shared (db) -> tab
  });

  pit('two shared, four tabs, all the rebases', async () => {
  });

  pit('many shared, many tabs', async () => {
  });

  pit('three shared w/ temporary partition', async () => {
  });
});
