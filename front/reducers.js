/**
 * @flow
 */

function invariant(val, message) {
  if (!val) throw new Error(message);
}

import {fromJS} from 'immutable';
import calcSideCoords from './calcSideCoords';
import predraw from './predraw';

import type {Context, Mark, Lines, WordRef, WordPos, Pos, MarkID, DOMEvent, Verses, FontConfig, SizeConfig, Marks, SideCoords} from './types';

function invariant(val, message) {
  if (!val) throw new Error(message);
}

type MarksMap = {
  [key: string]: mixed,
  toJS: () => Marks,
};

type MarkMap = {
  [key: string]: mixed,
  toJS: () => Mark,
};

var MARKS: Array<any> = [{
  start: {verse: 1, word: 10},
  end: {verse: 5, word: 5},
  type: 'sideline',
  style: {color: 'blue'},
}, {
  start: {verse: 0, word: 5},
  end: {verse: 0, word: 8},
  style: {
    color: 'red',
    underline: true,
  },
}, {
  start: {verse: 1, word: 1},
  end: {verse: 1, word: 8},
  style: {
    color: 'green',
  },
}, {
  start: {verse: 0, word: 2},
  end: {verse: 2, word: 5},
  type: 'sideline',
  style: {color: 'orange'},
}, {
  start: {verse: 1, word: 2},
  end: {verse: 3, word: 5},
  type: 'sideline',
  style: {color: 'green'},
}, {
  start: {verse: 3, word: 9},
  end: {verse: 5, word: 5},
  type: 'sideline',
  style: {color: 'red'},
}];

var MID = 0;
MARKS.forEach(mark => mark.id = MID++ + '');

type State = {
  font: FontConfig,
  size: SizeConfig,
  verses: Verses,

  viewer: {
    marks: MarksMap,
    sideCoords: SideCoords,
    pos: Pos,
    lines: Lines,
    editing: ?MarkID,
    editHandle: ?('start' | 'end'),
    pending: ?Mark,
  },
};

function getInitialState(verses, font, size): State {
  var marks = {};
  MARKS.forEach(mark => marks[mark.id] = mark);
  marks = fromJS(marks);

  var {lines, pos, img} = predraw(verses, size, font);
  var sideCoords = calcSideCoords(marks.toJS(), pos, font, size);

  return {
    font,
    size,
    verses,
    viewer: {
      marks,
      lines,
      pos,
      baseImg: img,
      sideCoords,
      editing: null,
      editHandle: null,
      pending: null,
    },
  };
}

var actions = {
  setPendingEnd(state, {end}) {
    invariant(state.pending, 'Cannot set pending end if no pending mark');
    if (state.pending.end.verse === end.verse &&
        state.pending.end.word === end.word) {
      return;
    }
    return {
      pending: {
        ...state.pending,
        end,
      }
    };
  },

  stopEditing(state) {
    return {editing: null};
  },

  startEditing(state, {id}) {
    return {
      editing: id,
    };
  },

  setEditPos(state, {target}, fullState) {
    var current = state.marks.getIn([state.editing, state.editHandle]);
    if (target.verse === current.get('verse') &&
        target.word === current.get('word')) {
      return;
    }
    var marks = state.marks.setIn([state.editing, state.editHandle], fromJS(target));

    return {
      marks,
      sideCoords: calcSideCoords(marks.toJS(), state.pos, fullState.font, fullState.size),
    }
  },

  setEditHandle(state, {handle}) {
    return {editHandle: handle};
  },

  changeMark(state, {arg, val}) {
    return {
      marks: state.marks.setIn([state.editing].concat(arg), val),
    };
  },

  setMarkStyle(state, {style}, fullState) {
    var mark = state.marks.get(state.editing);
    switch (style) {
      case 'sideline':
        mark = mark.set('type', 'sideline').setIn(['style', 'underline'], false);
        break;
      case 'highlight':
        mark = mark.set('type', 'highlight').setIn(['style', 'underline'], false);
        break;
      case 'underline':
        mark = mark.set('type', 'highlight').setIn(['style', 'underline'], true);
        break;
    }
    var marks = state.marks.set(state.editing, mark);
    return {
      marks,
      sideCoords: calcSideCoords(marks.toJS(), state.pos, fullState.font, fullState.size),
    };
  },

  setMarkColor(state, {color}) {
    return {
      marks: state.marks.setIn([state.editing, 'style', 'color'], color),
    };
  },

  finishEditMove(state) {
    var editing = state.marks.get(state.editing);
    var marks = state.marks.set(state.editing, fromJS(balance(editing.toJS())))
    // todo sidelines recalc?
    return {
      marks: marks,
      editHandle: null,
    };
  },

  finishCreating(state) {
    var id = MID++ + '';
    invariant(state.pending);
    return {
      marks: state.marks.set(id, fromJS({
        ...balance(state.pending),
        id,
      })),
      pending: null,
      editHandle: null,
      editing: id,
    }
  },

  startCreating(state, {target}) {
    return {
      editing: null,
      pending: {
        start: target,
        end: target,
        style: {color: 'blue'},
        id: 'pending',
      }
    };
  },
};

export default function (verses: Verses, font: FontConfig, size: SizeConfig): (state: ?State, action: Object) => State {
  return function reduce(state: ?State, action: Object): State {
    if (!state) state = getInitialState(verses, font, size);
    if (!actions[action.type]) {
      return state;
    }
    // invariant(actions[action.type], 'Unknown action type: ' + action.type);
    var newViewer = actions[action.type](state.viewer, action, state);
    if (!newViewer) return state;
    return {
      ...state,
      viewer: {
        ...state.viewer,
        ...newViewer,
      },
    };
  };
}

function isGreater(pos1, pos2) {
  return (pos1.verse > pos2.verse) || (
    pos1.verse === pos2.verse &&
    pos1.word > pos2.word
  );
}

function balance(mark) {
  if (isGreater(mark.start, mark.end)) {
    return {
      ...mark,
      start: mark.end,
      end: mark.start,
    };
  }
  return mark;
}


