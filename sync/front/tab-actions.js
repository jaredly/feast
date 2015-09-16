


















export function update({
  server, shared, local, pending, sharedHead, serverHead
}, {reducer, rebaser}, {
  oldServerHead, newServerHead,
  oldSharedHead, newSharedHead,
  newServerActions,
  oldSharedActions, newSharedActions,
}) {
  if (newServerHead === serverHead && newSharedHead === sharedHead) {
    return // no need
  }
  if (oldServerHead !== serverHead) {
    throw new Error('Invalid update: server head mismatch: ' + oldServerHead + ' : ' + serverHead);
  }
  if (oldSharedHead !== sharedHead) {
    throw new Error('Invalid update: shared head mismatch: ' + oldSharedHead + ' : ' + sharedHead);
  }
}

// server rebase
var {pending, serverHead} = STATE;
var sending = pending;
pending = [];
db.tryAddActions(sending, serverHead).then(({oldServerHead, newServerHead, newServerActions}) => {
  // rebasing
  if (oldServerHead !== serverHead) {
    throw new Error('Server head mismatch ' + serverHead + ' : ' + oldServerHead);
  }
  // server sync
.  if (!newServerActions.length) {
  }
  if (newServerActions.length) {
    serverHead = newServerHead
    pending = sending.concat(pending);
    pending = rebaser(pending, [], newServerActions);
    clients.forEach(client => {
      client.update(state, fns, {
        oldServerHead,
        newServerHead,
        oldSharedHead: client.sharedHead,
        newSharedHead: pending.head,
        newServerActions,
        oldSharedActions: sending.slice(0, client.sharedHead),
        newSharedActions: pending,
      });
    });
  }
  if (result.type === 'rebase') {
  }
});
update(state, fns, {
});










export function serverRebase({server, shared, local, pending, sharedHead, serverHead}, {reducer, rebaser}, {serverActions, oldSharedActions, newSharedActions, oldSharedHead, oldServerHead, newServerHead, newSharedHead}) {
  if (oldServerHead !== serverHead) {
    throw new Error('Invalid rebase: server head mismatch: ' + oldServerHead + ' : ' + serverHead);
  }
  if (oldSharedHead !== sharedHead) {
    throw new Error('Invalid rebase: shared head mismatch: ' + oldSharedHead + ' : ' + sharedHead);
  }
  server = serverActions.reduce(reducer, server);
  shared = newSharedActions.reduce(reducer, server);
  pending = rebaser(pending, oldSharedActions, newSharedActions);
  local = pending.reduce(reducer, shared);
  return {server, shared, local, pending, sharedHead: newSharedHead, serverHead: newServerHead};
}

export function sharedRebase({server, shared, local, pending, sharedHead, ...state}, {reducer, rebaser}, {sharedActions, serverHead, oldSharedHead, newSharedHead}) {
  if (serverHead !== state.serverHead) {
    throw new Error('Invalid rebase: server head mismatch: ' + state.serverHead + ' : ' + serverHead);
  }
  if (oldSharedHead !== sharedHead) {
    throw new Error('Invalid shared rebase: shared head mismatch: ' + oldSharedHead + ' : ' + sharedHead);
  }
  shared = sharedActions.reduce(reducer, shared);
  pending = rebaser(pending, [], sharedActions);
  local = pending.reduce(reducer, shared);
  return {server, shared, local, pending, sharedHead, serverHead};
}

export function serverSync({server, shared, local, pending, sharedHead, serverHead}, {reducer, rebaser}, {serverActions, sharedActions, oldServerHead, newServerHead, sharedHead}) {
  if (oldServerHead !== serverHead) {
    throw new Error('Invalid rebase: server head mismatch: ' + oldServerHead + ' : ' + serverHead);
  }
  server = serverActions.reduce(reducer, server);
  shared = sharedActions.reduce(reducer, server);
  local = pending.reduce(reducer, shared);
  return {server, shared, local, pending, sharedHead, serverHead};
}

export function sharedSync({server, shared, local, pending, sharedHead, serverHead}, {reducer}, {sharedActions, }) {
  shared = sharedActions.reduce(reducer, shared);
  // TODO verify that these are the same, and not send them...
  pending = pending.slice(sharedActions.length);
  local = pending.reduce(reducer, shared);
  return {server, shared, local, pending, sharedHead, serverHead};
}

