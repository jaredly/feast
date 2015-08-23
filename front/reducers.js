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

var WORDS = {
};

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

function gen() {
  return Math.random().toString(16).slice(2);
}

function getInitialState(verses, font, size): State {
  var marks = {};
  MARKS.forEach(mark => marks[mark.id] = mark);
  marks = fromJS(marks);

  var notes = {
    [gen()]: {
      mark: MARKS[0].id,
      text: 'Hello friends this is great',
    },
    [gen()]: {
      mark: MARKS[0].id,
      text: 'Another note on the same topic',
    },
    [gen()]: {
      mark: MARKS[1].id,
      text: 'This was a cool something that will now go on and on and never stop until it does at some later point unless it decites to continue blathering on about whatever it is.',
    },
  };
  for (var id in notes) {
    notes[id].id = id;
  }

  return {
    verses,
    marks,
    notes: fromJS(notes),
  };
}

var actions = {
  removeMark(state, {id}) {
    var marks = state.marks.delete(state.editing);
    return {
      marks: state.marks.delete(id),
    };
  },

  setMarkStyle(state, {id, style}) {
    var mark = state.marks.get(id);
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
    var marks = state.marks.set(id, mark);
    return {
      marks,
    };
  },

  changeNote(state, {id, text}) {
    return {
      notes: state.notes.setIn([id, 'text'], text),
    };
  },

  createNote(state, {mark, text}) {
    var id = gen();
    return {
      notes: state.notes.set(id, fromJS({id, mark, text})),
    };
  },

  removeNote(state, {id}) {
    return {
      notes: state.notes.delete(id),
    };
  },

  setMarkPos(state, {id, handle, pos}) {
    var mark = state.marks.get(id);
    return {
      marks: state.marks.set(id, fromJS(balance(mark.set(handle, pos).toJS()))),
    };
  },

  setMarkColor(state, {id, color}) {
    return {
      marks: state.marks.setIn([id, 'style', 'color'], color),
    };
  },

  addMark(state, {mark}) {
    return {
      marks: state.marks.set(mark.get('id'), mark),
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
    console.log(action);
    var newState = actions[action.type](state, action);
    if (!newState) return state;
    return {
      ...state,
      ...newState,
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


