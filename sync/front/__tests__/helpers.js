
import {EventEmitter} from 'events';

export function socketPair() {
  var one = new EventEmitter();
  var two = new EventEmitter();
  one.send = data => {
    console.log('one -> two', data);
    two.emit('message', data);
  };
  two.send = data => {
    console.log('two -> one', data);
    one.emit('message', data);
  };
  return [one, two];
}

export function laggySocketPair(lag) {
  lag = lag || 0;
  var one = new EventEmitter();
  var two = new EventEmitter();
  one.send = data => {
    console.log('one -> two', data);
    setTimeout(() => two.emit('message', data), lag);
  };
  two.send = data => {
    console.log('two -> one', data);
    setTimeout(() => one.emit('message', data), lag);
  };
  return [one, two];
}

