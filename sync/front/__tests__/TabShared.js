
import Shared from '../Shared';
import Tab from '../Tab';

import {socketPair, laggySocketPair} from './helpers';
import {expect} from 'chai';

function rebaser(actions, oldTail, newTail) {
  return actions;
}

function reducer(state, {action}) {
  if (!state) state = {names: []};
  return {names: state.names.concat([action.name])};
}

describe('TabShared stuff', () => {
  it('tab add action should sync w/ shared', () => {
    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    var shared = new Shared(null, rebaser);
    shared.addConnection(sharedSock);

    tab.addAction({name: 'hello'});

    expect(tab.state.shared).to.eql({names: ['hello']});
    expect(tab.state.local).to.eql({names: ['hello']});
  });

  it('should sync between two tabs', () => {
    var shared = new Shared(null, rebaser);

    var [tabSock, sharedSock] = socketPair();
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    var [tabSock2, sharedSock2] = socketPair();
    var tab2 = new Tab(tabSock2, reducer, rebaser);
    shared.addConnection(sharedSock2);

    tab.addAction({name: 'hello'});

    expect(tab.state.shared).to.eql({names: ['hello']});
    expect(tab.state.local).to.eql({names: ['hello']});
    expect(tab2.state.shared).to.eql({names: ['hello']});
    expect(tab2.state.local).to.eql({names: ['hello']});
  });

  it('should reconcile contending actions from two tabs', done => {
    var shared = new Shared(null, rebaser);

    var [tabSock, sharedSock] = laggySocketPair(2);
    var tab = new Tab(tabSock, reducer, rebaser);
    shared.addConnection(sharedSock);

    var [tabSock2, sharedSock2] = laggySocketPair(10);
    var tab2 = new Tab(tabSock2, reducer, rebaser);
    shared.addConnection(sharedSock2);

    tab2.addAction({name: 'world'});
    tab.addAction({name: 'hello'});

    var goal = {names: ['hello', 'world']};
    setTimeout(() => {
      expect(tab.state.shared).to.eql(goal, 'tab state');
      expect(tab.state.local).to.eql(goal, 'tab local');
      expect(tab2.state.shared).to.eql(goal, 'tab2 shared');
      expect(tab2.state.local).to.eql(goal, 'tab2 local');
      done();
    }, 100);
  });

  it('should reconcile contending actions from lots of tabs', done => {
    var shared = new Shared(null, rebaser);

    var tabs = [];
    for (var i=0; i<10; i++) {
      var [tabSock, sharedSock] = laggySocketPair(Math.floor(Math.random() * 4));
      var tab = new Tab(tabSock, reducer, rebaser);
      shared.addConnection(sharedSock);
      tabs.push(tab);
    }

    tabs.forEach((tab, i) => tab.addAction({name: 'first ' + i}));
    tabs.forEach((tab, i) => tab.addAction({name: 'second ' + i}));
    setTimeout(() => {
      var goal = shared.state.pending.reduce(reducer, null);
      console.log('shared', goal);

      tabs.forEach((tab, i) => {
        expect(tab.state.shared).to.eql(goal, i + 'tab state');
        expect(tab.state.local).to.eql(goal, i + 'tab local');
      });
      done();
    }, 1000);
  });
});

