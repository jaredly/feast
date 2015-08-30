// action creators...

import dbactions from './dbactions';
import db from './db';

var actions = {
  addMark: 'mark',
  changeNote: ['id', 'text'],
  createNote: ['id', 'mark', 'text'],
  removeNote: 'id',
  removeMark: 'id',
  removeTag: ['mid', 'tid'],
  addTag: ['mid', 'tid'],
  createAndAddTag: ['id', 'mid', 'namespace', 'name', 'color'],
  setMarkStyle: ['id', 'style'],
  setMarkColor: ['id', 'color'],
  setMarkPos: ['id', 'handle', 'pos'],
  setMarkEnds: ['id', 'start', 'end'],
};

export default dispatch => {
  var fns = {};
  function dbdispatch(action) {
    dispatch(action);
    dbactions[action.type].db(db, action).then(
      () => {},
      err => {
        console.log('FAILED to database', err);
      }
    );
  }
  Object.keys(actions).forEach(name => {
    if (typeof actions[name] === 'string') {
      fns[name] = function (arg) {
        dbdispatch({
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
        dbdispatch({
          ...args,
          type: name,
        });
      };
    } else {
      fns[name] = function () {
        dbdispatch({
          type: name,
        });
      };
    }
  });
  return fns;
};

