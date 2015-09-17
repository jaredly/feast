
import debug from 'debug';
const info = debug('sync:shared:info');
const warn = debug('sync:shared:warn');
const error = debug('sync:shared:error');

// shared handlers

export function addActions({pending, pendingStart, ...state}, {rebaser}, {actions, serverHead, sharedHead}) {
  if (serverHead !== state.serverHead) {
    // ignore?
    warn('ignoring request to add actions, as the server head is misaligned');
    return;
  }
  if (sharedHead !== pendingStart + pending.length) {
    warn('ignoring request to add actions, as the shared head is misaligned');
    return;
  }

  return {
    pending: pending.concat(actions),
    pendingStart,
    ...state,
  };
}

// remote stuff

export function serverSync({pending, pendingStart, serverHead, ...state}, {rebaser}, {actions, oldServerHead, newServerHead}) {
  if (oldServerHead === newServerHead) {
    return // noop
  }
  if (serverHead !== oldServerHead) {
    warn('invalid remote sync', serverHead, oldServerHead);
  }
  var rebased = rebaser(pending, null, actions);
  if (rebased.length < pending.length) {
    pendingStart += pending.length - rebased.length;
  }
  serverHead = newServerHead
  pending = rebased
  return {pending, serverHead, pendingStart};
}

