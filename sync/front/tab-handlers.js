// @ --- flow flow is broken somehow here...

import type {Sender, Pendings, Remote, Local, Reducer, Rebaser, ClientState, HeadID} from './types';

import debug from 'debug';
const info = debug('sync:tab:info');
const error = debug('sync:tab:error');

// tab handlers

const gen = () => Math.random().toString(16).slice(2);

type DumpData<State, Action> = {
  server: State,
  sharedActions: Pendings<Action>,
  serverHead: HeadID,
  sharedHead: HeadID
};

export function dump<State, Action>(
  state: ClientState<State, Action>,
  {reducer}: {reducer: Reducer<State, Action>},
  {server, sharedActions, serverHead, sharedHead}: DumpData<State, Action>
): ClientState<State, Action> {
  var shared = sharedActions.reduce(reducer, server);
  var local = shared;
  return {
    server, shared, local, serverHead, sharedHead,
    pending: [],
  };
}

export function addAction<State, Action>(
  {local, pending, ...state}: ClientState<State, Action>,
  {reducer}: {reducer: Reducer<State, Action>},
  {action}: {action: Action}
): ClientState<State, Action> {
  var item = {id: gen(), action};
  pending = pending.concat([item]);
  local = reducer(local, item);
  return {local, pending, ...state};
}

type SharedSyncData<Action> = {
  actions: Pendings<Action>,
  oldSharedHead: HeadID,
  newSharedHead: HeadID,
  serverHead: HeadID,
};

export function sharedSync<State, Action>(
  {shared, local, pending, sharedHead, ...state}: ClientState<State, Action>,
  {reducer, rebaser}: {reducer: Reducer<State, Action>, rebaser: Rebaser<Action>},
  {actions, oldSharedHead, newSharedHead, serverHead}: SharedSyncData<Action>
): ClientState<State, Action> {
  if (oldSharedHead !== sharedHead) {
    info('[shared sync] bad shared head', oldSharedHead, sharedHead);
    return;
  }
  if (serverHead !== state.serverHead) {
    info('[shared sync] bad server head', serverHead, state.serverHead);
    return;
  }
  // rebaser knows about "fast-forward"s
  pending = rebaser(pending, null, actions);

  shared = actions.reduce(reducer, shared);
  local = pending.reduce(reducer, shared);
  sharedHead = newSharedHead;
  return {shared, local, pending, sharedHead, ...state};
}

type ServerSyncData<Action> = {
  serverActions: Pendings<Action>,
  oldServerHead: HeadID,
  newServerHead: HeadID,
  oldSharedHead: HeadID,
  newSharedHead: HeadID,
  oldSharedActions: Pendings<Action>,
  newSharedActions: Pendings<Action>,
};

export function serverSync<State, Action>(
  {server, shared, local, pending, sharedHead, serverHead}: ClientState<State, Action>,
  {reducer, rebaser},
  {serverActions, oldServerHead, newServerHead, oldSharedHead, newSharedHead, oldSharedActions, newSharedActions}: ServerSyncData<Action>
): ClientState<State, Action> {
  if (oldSharedHead !== sharedHead) {
    info('[shared sync] bad shared head', oldSharedHead, sharedHead);
    return;
  }
  if (oldServerHead !== serverHead) {
    info('[shared sync] bad server head', oldServerHead, serverHead);
    return;
  }
  server = serverActions.reduce(reducer, server);
  shared = newSharedActions.reduce(reducer, server);
  pending = rebaser(pending, oldSharedActions, serverActions.concat(newSharedActions));
  local = pending.reduce(reducer, shared);
  sharedHead = newSharedHead
  serverHead = newServerHead
  return {
    server,
    shared,
    local,
    pending,
    sharedHead,
    serverHead,
  };
}

