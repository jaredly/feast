
import debug from 'debug';
const info = debug('sync:test:info');
const warn = debug('sync:test:warn');
const error = debug('sync:test:error');

import {EventEmitter} from 'events';

export const prom = fn => new Promise((res, rej) => fn((err, val) => err ? rej(err) : res(val)));

function asyncer(wrap) {
  return (text, fn) => {
    return wrap(text, done => fn().then(() => done(), done));
  }
}

export var pit = asyncer(it);
pit.only = asyncer(it.only.bind(it));
pit.skip = asyncer(it.skip.bind(it));

export function pwait(time) {
  return new Promise((res) => setTimeout(() => res(), time));
}

export function socketPair() {
  var one = new EventEmitter();
  var two = new EventEmitter();
  one.send = data => {
    // console.log('one -> two', data);
    two.emit('message', data);
  };
  two.send = data => {
    // console.log('two -> one', data);
    one.emit('message', data);
  };
  return [one, two];
}

export function laggySocketPair(lag) {
  lag = lag || 0;
  var one = new EventEmitter();
  var two = new EventEmitter();
  one.send = data => {
    // console.log('one -> two', data);
    setTimeout(() => two.emit('message', data), lag);
  };
  two.send = data => {
    // console.log('two -> one', data);
    setTimeout(() => one.emit('message', data), lag);
  };
  return [one, two];
}

function randomQueue(num, range) {
  var waiting = null;
  var queue = [];
  function next() {
    var fn = queue.shift();
    fn();
    var time = num + Math.floor(Math.random() * range);
    waiting = setTimeout(() => {
      waiting = null;
      if (queue.length) next();
    }, time);
  }
  return fn => {
    queue.push(fn);
    if (!waiting) next();
  }
}

export function randomSocketPair(min, range) {
  var one = new EventEmitter();
  var two = new EventEmitter();
  var qOne = randomQueue(min, range);
  var qTwo = randomQueue(min, range);
  one.send = data => {
    // console.log('one -> two', data);
    qOne(() => two.emit('message', data));
  };
  two.send = data => {
    // console.log('two -> one', data);
    qTwo(() => one.emit('message', data));
  };
  return [one, two];
}

export function pcheck(fn, tick, wait) {
  return prom(done => {
    var interval = setInterval(() => {
      if (fn()) {
        clearTimeout(timeout);
        clearInterval(interval);
        setTimeout(() => {
          done();
        }, tick);
      }
    }, tick);

    var timeout = setTimeout(() => {
      clearInterval(interval);
      done();
    }, wait);
  });
}

// keep trying `fn` every `tick` ms, and once it returns true, call `then`. If
// at least `wait` ms pass, then just call `then`.
export function checkUntil(fn, then, tick, wait) {
  var interval = setInterval(() => {
    if (fn()) {
      clearTimeout(timeout);
      clearInterval(interval);
      setTimeout(() => {
        then();
      }, tick);
    }
  }, tick);

  var timeout = setTimeout(() => {
    clearInterval(interval);
    then();
  }, wait);
}

