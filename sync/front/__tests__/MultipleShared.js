
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

  it.only('should handle multiple shared managers', done => {
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
      expect(db.state.num).to.equal(52, 'local db');
      expect(client.state.get('num')).to.equal(52, 'client state');
      expect(db2.state.num).to.equal(52, 'local db 2');
      expect(client2.state.get('num')).to.equal(52, 'client state 2');
      remoteDB.dump().then(({data, head}) => {
        expect(data.num).to.equal(52, 'remote db')
        done();
      }).catch(done);
    }, 1250)).catch(done);
  });
});

