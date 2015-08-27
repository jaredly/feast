
var actions = {
  addMark: 'mark',
  changeNote: ['id', 'text'],
  createNote: ['mark', 'text'],
  removeNote: 'id',
  removeMark: 'id',
  removeTag: ['mid', 'tid'],
  addTag: ['mid', 'tid'],
  createAndAddTag: ['mid', 'text'],
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

