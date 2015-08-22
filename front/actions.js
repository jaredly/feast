
var actions = {
  setPendingEnd: 'end',
  stopEditing: false,
  startEditing: 'id',
  setEditPos: 'target',
  setEditHandle: 'handle',
  finishEditMove: false,
  finishCreating: false,
  startCreating: 'target',
};

export default dispatch => {
  var fns = {};
  Object.keys(actions).forEach(name => {
    if (actions[name]) {
      fns[name] = function (arg) {
        dispatch({
          type: name,
          [actions[name]]: arg,
        });
      };
    } else {
      fns[name] = function () {
        dispatch({
          type: name,
        });
      };
    }
  });
  return fns;
};

