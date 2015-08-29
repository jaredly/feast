/**
 * @flow
 */

function invariant(val, message) {
  if (!val) throw new Error(message);
}

import {fromJS, Set, Map} from 'immutable';
import calcSideCoords from './calcSideCoords';
import predraw from './predraw';

import type {Context, Mark, Marks, Tags, Tag, Lines, WordRef, WordPos, Pos, MarkID, DOMEvent, Verses, FontConfig, SizeConfig, SideCoords} from './types';

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

type State = {
  font: FontConfig,
  size: SizeConfig,
  tags: Tags,
  marks: Marks,
  verses: Verses,
};

function getInitialState(verses, marks, tags, notes): State {
  return {
    verses,
    marks: fromJS(marks),
    tags: fromJS(tags),
    notes: fromJS(notes),
  };
}

var COLORS = ['red', 'green', 'blue', 'orange', 'purple', 'brown'];
function randColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

var actions = {
  removeMark(state, {id}) {
    return {
      marks: state.marks.delete(id),
    };
  },

  setMarkStyle(state, {id, style}) {
    return {
      marks: state.marks.setIn([id, 'type'], style),
    };
    /*
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
    */
  },

  changeNote(state, {id, text}) {
    return {
      notes: state.notes.setIn([id, 'text'], text),
    };
  },

  createNote(state, {id, mark, text}) {
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
      marks: state.marks.set(id, balanceIm(mark.set(handle, pos))),
    };
  },

  setMarkColor(state, {id, color}) {
    return {
      marks: state.marks.setIn([id, 'style', 'color'], color),
    };
  },

  createAndAddTag(state, {id, mid, text}) {
    console.log('new tag', mid, text, id);
    var namespace, name;
    if (text.indexOf(':') !== -1) {
      [namespace, name] = text.split(':');
    } else {
      name = text;
      namespace = '';
    }
    return {
      marks: state.marks.updateIn([mid, 'tags'], tags => tags.add(id)),
      tags: state.tags.set(id, Map({id, name, namespace, color: randColor()})),
    };
  },

  addTag(state, {mid, tid}) {
    return {
      marks: state.marks.updateIn([mid, 'tags'], tags => tags.add(tid)),
    };
  },

  removeTag(state, {mid, tid}) {
    return {
      marks: state.marks.updateIn([mid, 'tags'], tags => tags.delete(tid)),
    };
  },

  addMark(state, {mark}) {
    return {
      marks: state.marks.set(mark.get('id'), mark),
    };
  },
};

export default function (verses: Verses, marks, tags, notes): (state: ?State, action: Object) => State {
  return function reduce(state: ?State, action: Object): State {
    if (!state) state = getInitialState(verses, marks, tags, notes);
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

function isGreaterIm(pos1, pos2) {
  return (pos1.get('verse') > pos2.get('verse')) || (
    pos1.get('verse') === pos2.get('verse') &&
    pos1.get('word') > pos2.get('word')
  );
}

function balanceIm(mark) {
  if (isGreaterIm(mark.get('start'), mark.get('end'))) {
    return mark.set('start', mark.get('end'))
               .set('end', mark.get('start'));
  }
  return mark;
}



