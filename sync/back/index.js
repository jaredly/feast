
// is there one design that can accomodate polling and push?
//
// Polling is:
// - call an fn, return either "great", or "rebase onto these actions"
// Input is {
//   actions: [],
//   head: actionId,
// }
// output for "great" is {head: actionId}
// Output for "rebase" is {
//   rebase: [], // list of actions
// }
//

// The db has to be able to:
//
// - give me all actions
// - give me all the actions since {actionId}
// - add these actions

type ActionID = string;

type Action = Object;

type Promise<T, V> = {
  then: (fn: (val: T) => (Promise<V> | V)) => Promise<V>,
  catch: (fn: (err: Error) => Promise<V> | V) => Promise<V>,
};

type Database = {
  getLatestAction: () => ActionID,
  getAllActions: () => Promise<{actions: Array<Action>, head: ActionID}>,
  getActionsSince: (actionID: ActionID) => Promise<{actions: Array<Action>, head: ActionID}>,
  addActions: (actions: Array<Action>) => Promise<ActionID>,
};

export default db => async function newActions(actions, head) {
  const latest = db.getLatestActionID();
  if (head !== latest) {
    const {actions, head: newHead} = await this.db.getActionsSince(head);
    return {rebase: actions, head: newHead};
  }
  return {head: await this.db.addActions(actions)};
}

