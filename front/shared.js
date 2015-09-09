
import Shared from '../sync/front/shared';
import JSocket from './JSocket';
import db from './db';

// FIRST RUN
// <- latest sync === 0
// -> update: all the actions (maybe none though)
// ---
// -> update maybe more
// <- here's some stuff
// -> thx
// <- here's some more stuff
// -> wait plz rebase
// <- ok here's the rebase stuff
// -> thx
// -> somebody else updated


class DBMiddle {
  constructor(db) {
    this.db = db;
  }

  getLatestSync() {
    return this.db.meta.get('sync');
  }

  setLatestSync(head, time) {
    return this.db.meta.set({head, time, id: 'sync'}, 'sync');
  }

  load(data) {
    // this is where you need knowledge of the DB setup.
  }
}

var dbMid = new DBMiddle(db);
var conn = new APITalker('http://localhost:9019');
var shared = new SharedManager(db, conn);

onconnect = function (e) {
  var port = e.ports[0];
  shared.addConnection({
    listen(fn) {
      port.addEventListener('message', (e) => fn(e.data));
      port.start();
    },
    send(data) {
      port.postMessage(data);
    }
  });
}

