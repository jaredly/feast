
// tab handlers

const gen = () => Math.random().toString(16).slice(2);

export function addAction({local, pending, ...state}, {reducer}, {action}) {
  var item = {id: gen(), action};
  pending = pending.concat([item]);
  local = reducer(local, item);
  return {local, pending, ...state};
}

export function sharedSync({shared, local, pending, sharedHead, ...state}, {reducer, rebaser},
                           {actions, oldSharedHead, newSharedHead, serverHead}) {
  if (oldSharedHead !== sharedHead) {
    console.log('[shared sync] bad shared head', oldSharedHead, sharedHead);
    return;
  }
  if (serverHead !== state.serverHead) {
    console.log('[shared sync] bad server head', serverHead, state.serverHead);
    return;
  }
  // rebaser knows about "fast-forward"s
  pending = rebaser(pending, null, actions);

  shared = actions.reduce(reducer, shared);
  local = pending.reduce(reducer, shared);
  sharedHead = newSharedHead;
  return {shared, local, pending, sharedHead, ...state};
}

export function serverSync({server, shared, local, pending, sharedHead, serverHead}, {reducer},
                           {serverActions, oldServerHead, newServerHead}) {
  var x;
}

