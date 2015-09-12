
import fs from 'fs';

export function patchPort(port, fromId, toId, viz) {
  var oldMessage = port.postMessage;
  port.postMessage = data => {
    viz.log(fromId, toId, data.type, data);
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
      viz.log(fromId, db.id, name, [].slice.call(arguments));
      return db[name].apply(db, arguments).then(val => {
        viz.log(db.id, fromId, name, val);
        return val;
      }, err => {
        viz.log(db.id, fromId, name, err);
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
}

export class Viz {
  constructor(outname) {
    this.outname = outname
    this._log = [];
  }

  log(fromId, toId, name, args) {
    console.log('logging', fromId, toId, name, args);
    this._log.push({fromId, toId, name, args});
  }

  dump() {
    fs.writeFileSync(this.outname, JSON.stringify(this._log, null, 2));
  }
}
