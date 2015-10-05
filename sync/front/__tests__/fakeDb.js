import debug from 'debug';
const info = debug('sync:fakeDb:info');
const warn = debug('sync:fakeDb:warn');
const error = debug('sync:fakeDb:error');

export default function fakeDb(reducer, data, serverHead, pending) {
  var added = [];
  return {
    async dumpData() {
      info('dumping', data, added, serverHead);
      return {
        data: added.reduce(reducer, data),
        serverHead,
      };
    },
    async dump() {
      info('dumping', serverHead, data, added, pending);
      return {
        serverHead,
        pending: pending || [],
        data: added.reduce(reducer, data),
      };
    },
    async setDump(stuff) {
      data = stuff.data
      pending = stuff.pending
      serverHead = stuff.serverHead
    },
    // fire & forget
    addPending(pending) {
    },
    // normally would 1) apply actions to db, 2) remove pending
    commitPending(pending, newServerHead) {
      info('committing actions', pending, newServerHead, added);
      added = added.concat(pending);
      serverHead = newServerHead;
    },
    // after a rebase, need to remove the old pending, and replace with the
    // rebased pending.
    replacePending(oldPending, newPending, newServerHead) {
      serverHead = newServerHead;
    },
    addActions(actions, newServerHead) {
      info('adding actions', actions, newServerHead, added);
      added = added.concat(actions);
      serverHead = newServerHead;
    },
  };
}

