/* @flow */

export type Sync = {
  head: number,
  time: number,
};

/*
export type Promise<T> = {
  then: (fn: (val: T) => S, catcher?: (err: Error) => S) => Promise<S>,
  catch: (fn: (err: Error) => S) => Promise<S>,
};
*/

export type Pending<Action> = {
  id: string,
  action: Action,
};

export type SharedDB<State, Action> = {
  getPendingActions: () => Promise<Array<Action>>,
  getLatestSync: () => Promise<?Sync>,
  commitPending: (pending: Array<Pending<Action>>) => Promise<void>,
  applyActions: (actions: Array<Action>) => Promise<void>,
  applyAction: (action: Action) => Promise<void>,
  addPending: (pending: Array<Pending<Action>>) => Promise<void>,
  removePending: (pending: Array<Pending<Action>>) => Promise<void>,
  load: (data: State) => Promise<void>,
  dump: () => Promise<State>,
};

