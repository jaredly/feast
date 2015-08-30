/**
 * @flow
 */

function invariant(val, message) {
  if (!val) throw new Error(message);
}

import {fromJS} from 'immutable';
import dbactions from './dbactions';

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

var actions = {};
for (var name in dbactions) {
  actions[name] = dbactions[name].x;
}

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

