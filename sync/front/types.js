/* @flow */

export type Reducer<State, Action> = (state: ?State, action: Action) => State;

export type Sync = {
  head: number,
  time: number,
};

export type Pending<Action> = {
  id: string,
  action: Action,
};

export type SharedDB<State, Action> = {
  getPendingActions: () => Promise<Array<Action>>,
  getLatestSync: () => Promise<?Sync>,
  setLatestSync: (sync: Sync) => Promise<void>,
  commitPending: (pending: Array<Pending<Action>>) => Promise<void>,
  applyActions: (actions: Array<Action>) => Promise<void>,
  applyAction: (action: Action) => Promise<void>,
  addPending: (pending: Array<Pending<Action>>) => Promise<void>,
  removePending: (pending: Array<Pending<Action>>) => Promise<void>,
  load: (data: State) => Promise<void>,
  dump: () => Promise<State>,
};

export type AddResult<Action> = {
  type: 'rebase',
  rebase: Array<Action>,
  head: number,
} | {
  type: 'sync',
  head: number,
};

export type RemoteDB<State, Action> = {
  getActionsSince: (head: number) => Promise<{actions: Array<Action>, head: number}>,
  tryAddActions: (actions: Array<Action>, head: number) => Promise<AddResult>,
  dump: () => Promise<{data: State, head: number}>,
};

