
// shared handlers

export function addActions({pending, pendingStart, ...state}, {rebaser}, {actions, serverHead, sharedHead}) {
  if (serverHead !== state.serverHead) {
    // ignore?
    console.error('ignoring request to add actions, as the server head is misaligned');
    return;
  }
  if (sharedHead !== pendingStart + pending.length) {
    console.error('ignoring request to add actions, as the shared head is misaligned');
    return;
  }

  return {
    pending: pending.concat(actions),
    pendingStart,
    ...state,
  };
}

