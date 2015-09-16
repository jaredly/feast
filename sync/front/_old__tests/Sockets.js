
import {expect} from 'chai';
import {EventEmitter} from 'events';

import Socketback from '../Socketback';
import Socketeer from '../Socketeer';
import prom from '../prom';

function tick(fn) {
  setTimeout(fn, 1);
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

describe('Socketback/eer', () => {
  it('Should back and forth', done => {
    var {seer, sack} = make(null, {
      ping: () => 'pong',
    });

    seer.send('ping').then(val => {
      expect(val).to.equal('pong');
      done();
    });
  });

  it('should push', done => {
    var {seer, sack} = make(data => {
      expect(data.type).to.equal('beep');
      done();
    });

    sack.send({type: 'beep'});
  });

  it('should drop in-between', done => {
    var {seer, sack} = make(data => {
      done(new Error('This should have been dropped'));
    }, {
      ping: () => prom(done => setTimeout(() => {
        done(null, 'pong');
      }, 10)),
    });

    seer.send('ping').then(val => {
      expect(val).to.equal('pong');
      done();
    });
    sack.send('should drop');
  });

  it('should accept when not waiting', done => {
    var {seer, sack} = make(data => {
      expect(data).to.equal('extra');
      done();
    }, {
      ping: () => prom(done => setTimeout(() => {
        done(null, 'pong');
      }, 10)),
    });

    seer.send('ping').then(val => {
      expect(val).to.equal('pong');
      sack.send('extra');
    });
  });
});

