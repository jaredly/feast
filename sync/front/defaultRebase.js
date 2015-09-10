
// super dumb rebaser -- just assume that none of the actions depended on the
// old ones. This **will be broken** in any number of situations.
// So I should probably remove it.
export default function defaultRebase(actions, newTail, oldTail) {
  return actions;
}

