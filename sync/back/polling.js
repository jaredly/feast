
// Whereas a push model has
// - register a connection? or just emit an event...
// - from a connection, do a something

// Hmm I like the polling model better. Maybe a websocket that just says "ok
// make a request now";


import backer from './';

export default class PollingBack {
  constructor(db) {
    this.conns = [];
    this.db = db;
  }

  addConnection(conn) {
    this.conns.push(conn);
    conn.on('message', ({changes, head}) => {
      this.db.tryAddActions(changes, head).then(result => {
        if (result.rebase) {
          conn.send({
            type: 'rebase',
            rebase: result.rebase,
            head: result.head,
            oldHead: head
          });
        } else {
          conn.send({type: 'head', head: result.head, oldHead: head});
          this.conns.forEach(c => {
            if (c !== conn) {
              c.send({type: 'update', changes, head: result.head, oldHead: head});
            }
          });
        }
      }, err => {
        console.log('failed?', err);
      });
    });
  }
}

