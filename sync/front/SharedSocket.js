
export default class SharedSocketManager {
  constructor(db, conn) {
    this.pending = [];
    this.head = 0;

    this.db = db;
    this.conn = conn;
    this.conn.listen(message => {
      if (message.type === 'rebase') {
        // hmmmm
        if (this.head === message.oldHead) {
          this.pending = rebase(this.pending, message.rebase);
          this.head = message.head;
          this.db.applyActions(message.rebase, message.head);
          this.sync();
        } else {
          console.error('Got rebase but we have moved on???');
        }
      } else if (message.type === 'head') {
        // success!!!
        if (this.head === message.oldHead) {
          var pending = this.pending;
          this.pending = [];
          this.db.clearPending(pending);
        } else {
          console.log('got success but we have moved on???');
        }
      }
    });
  }

  init() {
    return Promise.add([
      this.db.getPendingActions(),
      this.db.getLatestSync(),
    ]).then(([pending, sync]) => {
      this.lastPendingID = pending ? pending[pending.length - 1].id : 0;
      this.pending = pending;
      this.head = sync ? sync.head || 0;
      this.conn.init(pending, this.head);
      /*
      if (pending.length) {
        this.conn.
      }
      */
    });
  }

  sync() {
    this.conn.sync(this.pending, this.head);
  }

  addAction(action) {
    this.pendingActions = [];
  }

}

