/**
 * @flow
 */

import {fromJS} from 'immutable';
import dbactions from './dbactions';

import type {Context, Mark, Marks, Tags, Tag, Lines, WordRef, WordPos, Pos, MarkID, DOMEvent, Verses, FontConfig, SizeConfig, SideCoords} from './types';

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
    marks: fromJS(marks).map(m => m.set('tags', m.get('tags').toSet())),
    tags: fromJS(tags),
    notes: fromJS(notes).map(n => n.set('mark', n.get('annotation_id'))),
  };
}

export default function (verses: Verses, marks, tags, notes): (state: ?State, action: Object) => State {
  return function reduce(state: ?State, action: Object): State {
    if (!state) state = getInitialState(verses, marks, tags, notes);
    if (!dbactions[action.type]) {
      return state;
    }
    console.log('Action:', action);
    var newState = dbactions[action.type].x(state, action);
    if (!newState) return state;
    return {
      ...state,
      ...newState,
    };
  };
}

