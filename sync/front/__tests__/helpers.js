
import {EventEmitter} from 'events';

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

export function fakeDb(reducer, data, pending) {
  var added = [];
  return {
    async dumpData() {
      return added.reduce(reducer, data);
    },
    async dump() {
      return {
        pending: pending || [],
        data: added.reduce(reducer, data),
      };
    },
    // fire & forget
    addPending(pending) {
    },
    // normally would 1) apply actions to db, 2) remove pending
    commitPending(pending) {
      added = added.concat(pending);
    },
    // after a rebase, need to remove the old pending, and replace with the
    // rebased pending.
    replacePending(oldPending, newPending) {
    },
    addActions(actions) {
      added = added.concat(actions);
    },
  };
}

