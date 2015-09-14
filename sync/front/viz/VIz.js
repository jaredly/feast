
import fs from 'fs';

export function patchPort(port, fromId, toId, viz) {
  var oldMessage = port.postMessage;
  port.postMessage = data => {
    viz.log(fromId, toId, data.type, data, 'message');
    oldMessage.call(port, data);
  }
}

export function wrapDb(db, fromId, viz) {
  var proxy = {};
  var names = Object.getOwnPropertyNames(db.__proto__);
  if (db.__proto__.__proto__ !== Object.prototype) {
    names = names.concat(Object.getOwnPropertyNames(db.__proto__.__proto__));
  }
  names.forEach(name => {
    if (name === 'constructor') return;
    proxy[name] = function () {
      viz.log(fromId, db.id, name, [].slice.call(arguments), 'call');
      return db[name].apply(db, arguments).then(val => {
        viz.log(db.id, fromId, name, val, 'reply');
        return val;
      }, err => {
        viz.log(db.id, fromId, name, err, 'error');
        throw err;
      });
    }
  });

  return proxy;
}

export function patchTab(tab, viz) {
  var oldSet = tab.setState;
  tab.setState = (state, type) => {
    viz.log(tab.id, null, 'state:' + (type || 'local'), state);
    return oldSet.call(tab, state, type);
  };
  var oldAction = tab.addAction;
  tab.addAction = action => {
    viz.log(tab.id, null, 'add action', action);
    return oldAction.call(tab, action);
  };
  var oldHead = tab.setHead;
  tab.setHead = (head, type) => {
    viz.log(tab.id, null, 'head:' + (type || 'local'), head);
    return oldHead.call(tab, head, type);
  };
  var oldRebase = tab.rebase;
  tab.rebase = (response, fromServer) => {
    viz.log(tab.id, null, 'rebase' + (fromServer ? ':server' : ''), response);
    return oldRebase.call(tab, response, fromServer);
  };
}

export class Viz {
  constructor(outname) {
    this.outname = outname
    this._log = [];
  }

  log(fromId, toId, name, args, type) {
    console.log('logging', fromId, toId, name, args, type);
    var stack = new Error().stack;
    this._log.push({fromId, toId, name, args, type, stack});
  }

  dump() {
    fs.writeFileSync(this.outname, JSON.stringify(this._log, null, 2));
  }
}
