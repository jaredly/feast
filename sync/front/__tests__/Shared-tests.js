
import LaggyMemRemote from './LaggyMemRemote';
import MemRemote from '../../back/MemRemote';
import Shared from '../Shared';
import Tab from '../Tab';

import {pit, pwait, pcheck, prom, socketPair, laggySocketPair, randomSocketPair, checkUntil} from './helpers';
import {expect} from 'chai';
import chalk from 'chalk';

function rand(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function rebaser(actions, oldTail, newTail) {
  return actions.map(({id, action: {name}}) => ({id, action: {name: name + '+'}}));
}

function reducer(state, {action}) {
  if (!state) state = {names: []};
  return {names: state.names.concat([action.name])};
}

// TODO figure out which of these I can abstract the remote from too. Probably
// just the ones w/ LaggyMemRemote
export default (makeDb/*, makeRemote*/) => {
  const makeLocal = async (reducer, data, serverHead, pending) => {
    const db = makeDb(reducer);
    if (data || serverHead || pending) {
      await db.setDump({data, serverHead, pending})
    }
    return db;
  };

  describe('Shared.js', () => {
    pit('should initialize a tab', async () => {
      var remote = new MemRemote(reducer);
      var db = await makeLocal(reducer, {names: ['woah']}, 1, [{id: 'theid', action: {name: 'awesome'}}]);
      var shared = new Shared(db, remote);

      var [tabSock, sharedSock] = socketPair();
      var tab = new Tab(tabSock, reducer, rebaser);
      shared.addConnection(sharedSock);

      await Promise.all([shared.init(), tab.init()]);
      expect(tab.state.local).to.eql({names: ['woah', 'awesome']});
    });

    pit('should initialize after added', async () => {
      var remote = new MemRemote(reducer);
      var db = await makeLocal(reducer, {names: ['woah']}, 1, [{id: 'theid', action: {name: 'awesome'}}]);
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
      var db = await makeLocal(reducer, {names: ['woah']}, 1, [{id: 'theid', action: {name: 'awesome'}}]);
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
      var db = await makeLocal(reducer, null, false);
      var shared = new Shared(db, remote, rebaser, 1);

      await shared.init();
      await pwait(2);

      expect(shared.state.serverHead).to.equal('first', 'shared serverHead');
      expect((await db.dumpData()).data).to.eql({names: ['thefirst']}, 'db dump');
    });

    pit('should sync a remote w/ pending', async () => {
      var remote = new MemRemote(reducer, [{id: 'first', action: {name: 'thefirst'}}]);
      var db = await makeLocal(reducer, null, null, [{
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

      var db1 = await makeLocal(reducer, null, null, [{id: 'second', action: {name: 'thesecond'}}]);
      var shared1 = new Shared(db1, remote, rebaser, 1);
      shared1.id = 'shared1'

      var db2 = await makeLocal(reducer, null, null, [{id: 'third', action: {name: 'thethird'}}]);
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

      var db1 = await makeLocal(reducer, null, null, [{id: 'second', action: {name: 'thesecond'}}]);
      var shared1 = new Shared(db1, remote, rebaser, 2);
      shared1.id = chalk.blue('shared1')

      var db2 = await makeLocal(reducer, null, null, [{id: 'third', action: {name: 'thethird'}}]);
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
      var db = await makeLocal(reducer, null, false);
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


    pit('full stack sync remote -> shared -> tab -> shared -> remote', async () => {
      var remote = new MemRemote(reducer, [{id: 'first', action: {name: 'thefirst'}}]);
      // db starts synced.
      var db = await makeLocal(reducer, null, null);
      var shared = new Shared(db, remote, rebaser, 1);
      shared.id = chalk.blue('shared');

      var [tabSock, sharedSock] = socketPair();
      var tab = new Tab(tabSock, reducer, rebaser);
      tab.id = chalk.green('tab');
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
    });

    pit('two shared, four tabs', async () => {
      var remote = new LaggyMemRemote(reducer, [{id: 'first', action: {name: 'thefirst'}}], 10);

      var db1 = await makeLocal(reducer, null, null);
      var shared1 = new Shared(db1, remote, rebaser, 1);
      shared1.id = chalk.blue('shared1');

      var db2 = await makeLocal(reducer, null, null);
      var shared2 = new Shared(db2, remote, rebaser, 1);
      shared2.id = chalk.green('shared2');

      var shareds = [shared1, shared2];
      
      var tabs = [];
      shareds.forEach((shared, s) => {
        for (var i=0; i<2; i++) {
          var n = s * 2 + i;
          var [tabSock, sharedSock] = socketPair();
          var tab = new Tab(tabSock, reducer, rebaser);
          tab.id = chalk.green('tab' + n);
          shared.addConnection(sharedSock);
          tabs.push(tab);
        }
      });

      await Promise.all(shareds.concat(tabs).map(s => s.init()));

      tabs[0].addAction({name: 'hello'});
      tabs.forEach((tab, i) => tab.addAction({name: 'from' + i}));

      await pwait(100);
      expect(shared1.state.serverHead).to.equal(remote.head, 'shared serverHead');
      expect(shared2.state.serverHead).to.equal(remote.head, 'shared serverHead');
      var goalData = remote.actions.reduce(reducer, null);
      tabs.forEach((tab, i) => {
        expect(tab.state.serverHead).to.equal(remote.head, 'tab serverHead' + i);

        expect(tab.state.local).to.eql(goalData, 'tab-local' + i);
        expect(tab.state.shared).to.eql(goalData, 'tab-shared' + i);
        expect(tab.state.server).to.eql(goalData, 'tab-server' + i);
      });
      expect((await db1.dumpData()).data).to.eql(goalData, 'db1 dump');
      expect((await db2.dumpData()).data).to.eql(goalData, 'db2 dump');
    });

    pit('two shared, four tabs, all the rebases', async () => {
      var remote = new LaggyMemRemote(reducer, [{id: 'first', action: {name: 'thefirst'}}], 10);

      var db1 = await makeLocal(reducer, null, null, [{id: 'shared1action', action: {name: 'fromshared1'}}]);
      var shared1 = new Shared(db1, remote, rebaser, 1);
      shared1.id = chalk.blue('shared1');

      var db2 = await makeLocal(reducer, null, null, [{id: 'shared2action', action: {name: 'fromshared2'}}]);
      var shared2 = new Shared(db2, remote, rebaser, 1);
      shared2.id = chalk.green('shared2');

      var shareds = [shared1, shared2];
      
      var tabs = [];
      shareds.forEach((shared, s) => {
        for (var i=0; i<2; i++) {
          var n = s * 2 + i;
          var [tabSock, sharedSock] = socketPair();
          var tab = new Tab(tabSock, reducer, rebaser);
          tab.id = chalk.green('tab' + n);
          shared.addConnection(sharedSock);
          tabs.push(tab);
        }
      });

      await Promise.all(shareds.concat(tabs).map(s => s.init()));

      tabs[0].addAction({name: 'hello'});
      tabs.forEach((tab, i) => tab.addAction({name: 'from' + i}));

      await pwait(100);
      expect(shared1.state.serverHead).to.equal(remote.head, 'shared serverHead');
      expect(shared2.state.serverHead).to.equal(remote.head, 'shared serverHead');
      var goalData = remote.actions.reduce(reducer, null);
      tabs.forEach((tab, i) => {
        expect(tab.state.serverHead).to.equal(remote.head, 'tab serverHead' + i);

        expect(tab.state.local).to.eql(goalData, 'tab-local' + i);
        expect(tab.state.shared).to.eql(goalData, 'tab-shared' + i);
        expect(tab.state.server).to.eql(goalData, 'tab-server' + i);
      });
      expect((await db1.dumpData()).data).to.eql(goalData, 'db1 dump');
      expect((await db2.dumpData()).data).to.eql(goalData, 'db2 dump');
    });

    pit('many shared, many tabs', async () => {
      var stored = [];
      var num_stored = rand(4, 10);
      for (var i=0; i<num_stored; i++) {
        stored.push({
          id: 'stored' + i,
          action: {name: 'fromstored' + i}
        });
      }
      var remote = new LaggyMemRemote(reducer, stored, 10);

      var NUM_SHARED = 10;
      var NUM_TABS = 4;

      var dbs = [];
      var shareds = [];
      var tabs = [];
      for (var i=0; i<NUM_SHARED; i++) {
        var pending = [];
        var num_pending = rand(2, 6);
        for (var p=0; p<num_pending; p++) {
          pending.push({id: 'shared' + i + 'pending' + p, action: {
            name: 'from' + i + ':' + p
          }});
        }
        var db = await makeLocal(reducer, null, null, pending);
        var shared = new Shared(db, remote, rebaser, 1);
        shared.id = chalk.blue('shared' + i);
        shareds.push(shared);
        dbs.push(db);

        for (var t=0; t<NUM_TABS; t++) {
          var n = i * NUM_TABS + t;
          var [tabSock, sharedSock] = socketPair();
          var tab = new Tab(tabSock, reducer, rebaser);
          tab.id = chalk.green('tab' + n);
          shared.addConnection(sharedSock);
          tabs.push(tab);
        }
      }

      await Promise.all(shareds.concat(tabs).map(s => s.init()));

      tabs[0].addAction({name: 'hello'});
      tabs.forEach((tab, i) => setTimeout(() => {
        tab.addAction({name: 'tabfrom' + i})
      }, rand(10, 30)));

      await pwait(200);
      shareds.forEach((shared, s) => {
        expect(shared.state.serverHead).to.equal(remote.head, 'shared serverHead' + s);
      });

      var goalData = remote.actions.reduce(reducer, null);
      tabs.forEach((tab, i) => {
        expect(tab.state.serverHead).to.equal(remote.head, 'tab serverHead' + i);

        expect(tab.state.local).to.eql(goalData, 'tab-local' + i);
        expect(tab.state.shared).to.eql(goalData, 'tab-shared' + i);
        expect(tab.state.server).to.eql(goalData, 'tab-server' + i);
      });
      for (var i=0; i<dbs.length; i++) {
        var db = dbs[i];
        expect((await db.dumpData()).data).to.eql(goalData, 'db' + i + ' dump');
      }
    });
  });
}
