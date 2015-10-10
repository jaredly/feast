/* @flow */

export type HeadID = string;
export type PendID = string;

export type Pending<Action> = {id: PendID, action: Action};
export type Pendings<Action> = Array<Pending<Action>>;

export type Rebaser<Action> = (
  actions: Pendings<Action>,
  prevTail: Pendings<Action>,
  newTail: Pendings<Action>
) => Pendings<Action>;

export type ServerSync<Action> = {
  actions: ?Pendings<Action>,
  oldServerHead: HeadID,
  newServerHead: HeadID,
};

export type AddActions<Action> = {
  actions: Pendings<Action>,
  serverHead: HeadID,
  sharedHead: HeadID,
};

export type Remote<Action> = {
  dump: () => Promise<{data: Object, serverHead: HeadID}>,
  onExtra?: (fn: (data: any) => any) => void,
  onDisconnect?: (fn: () => void) => void,
  sync: (args: {actions: Pendings<Action>, serverHead: HeadID}) => Promise<ServerSync<Action>>,
};

export type LocalDump<Action> = {data: Object, serverHead: HeadID, pending: Pendings<Action>};

export type Local<Action> = {
  dump: () => Promise<LocalDump<Action>>,
  dumpData: () => Promise<{data: Object, serverHead: HeadID}>,
  // these are "fire and forget"
  setDump: (dump: LocalDump<Action>) => any,
  addActions: (actions: Pendings<Action>, serverHead: HeadID) => any,
  commitPending: (actions: Pendings<Action>, serverHead: HeadID) => any,
  addPending: (actions: Pendings<Action>) => any,
};

export type SharedState<Action> = {
  serverHead: HeadID,
  pending: Pendings<Action>,
  pendingStart: number,
};

export type Sender = {
  on: (ev: string, fn: (obj: {type: string, data: any}) => any) => void,
  send: (data: Object) => void,
};

