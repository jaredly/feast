
var actions = {
  /*
  setPendingEnd: 'end',
  stopEditing: false,
  startEditing: 'id',
  setEditPos: 'target',
  changeMark: ['arg', 'val'],
  setMarkStyle: 'style',
  setMarkColor: 'color',
  setEditHandle: 'handle',
  finishEditMove: false,
  finishCreating: false,
  removeMark: false,
  startCreating: 'target',
  */
  addMark: 'mark',
  changeNote: ['id', 'text'],
  createNote: ['mark', 'text'],
  removeMark: 'id',
  setMarkStyle: ['id', 'style'],
  setMarkColor: ['id', 'color'],
  setMarkPos: ['id', 'handle', 'pos'],
};

export default dispatch => {
  var fns = {};
  Object.keys(actions).forEach(name => {
    if (typeof actions[name] === 'string') {
      fns[name] = function (arg) {
        dispatch({
          type: name,
          [actions[name]]: arg,
        });
      };
    } else if (Array.isArray(actions[name])) {
      fns[name] = function () {
        var args = {};
        actions[name].forEach((arg, i) => {
          args[arg] = arguments[i];
        });
        dispatch({
          ...args,
          type: name,
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

