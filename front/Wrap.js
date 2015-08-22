/**
 * @flow
 */

import React from 'react';
import Remarkable from './Rem2';
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
  marks: MarksMap,
  sideCoords: SideCoords,
  pos: Pos,
  lines: Lines,
  editing: ?MarkID,
  editHandle: ?('start' | 'end'),
  pending: ?Mark,
};

type WrapProps = {
  font: FontConfig,
  size: SizeConfig,
  verses: Verses,
}

export default class Wrappable extends React.Component {
  state: State;
  props: WrapProps;
  constructor(props: WrapProps) {
    super(props);

    var marks = {};
    MARKS.forEach(mark => marks[mark.id] = mark);
    marks = fromJS(marks);

    var {lines, pos, img} = predraw(this.props.verses, this.props.size, this.props.font);
    var sideCoords = this._calcMarks(marks, pos);

    this.state = {
      marks,
      lines,
      pos,
      baseImg: img,
      sideCoords,
      editing: null,
      editHandle: null,
      pending: null,
    };
  }

  _calcMarks(marks: MarksMap, pos: Pos): SideCoords {
    return calcSideCoords(marks.toJS(), pos, this.props.font, this.props.size);
  }

  _setMarks(marks: MarksMap) {
    this.setState({
      marks,
      sideCoords: this._calcMarks(marks, this.state.pos)
    });
  }

  setPendingEnd(end: WordRef) {
    invariant(this.state.pending, 'Cannot set pending end if no pending mark');
    if (this.state.pending.end.verse === end.verse &&
        this.state.pending.end.word === end.word) {
      return;
    }
    this.setState({pending: {
      ...this.state.pending,
      end,
    }});
  }

  stopEditing() {
    this.setState({editing: null});
  }

  startEditing(id: MarkID) {
    this.setState({
      editing: id,
    });
  }

  setEditPos(target: WordRef) {
    var current = this.state.marks.getIn([this.state.editing, this.state.editHandle]);
    if (target.verse === current.get('verse') &&
        target.word === current.get('word')) {
      return;
    }
    var marks = this.state.marks.setIn([this.state.editing, this.state.editHandle], fromJS(target));
    this._setMarks(marks);
  }

  getEditing(): MarkMap {
    return this.state.marks.get(this.state.editing);
  }

  setEditHandle(handle: 'start' | 'end') {
    this.setState({editHandle: handle})
  }

  finishEditMove() {
    var marks = this.state.marks.set(this.state.editing, fromJS(balance(this.getEditing().toJS())))
    // todo sidelines recalc
    this.setState({
      marks: marks,
      editHandle: null,
    });
  }

  finishCreating() {
    var id = MID++ + '';
    invariant(this.state.pending);
    this.setState({
      marks: this.state.marks.set(id, fromJS({
        ...balance(this.state.pending),
        id,
      })),
      pending: null,
      editHandle: null,
      editing: id,
    });
  }

  startCreating(target: WordRef) {
    this.setState({
      editing: null,
      pending: {
        start: target,
        end: target,
        style: {color: 'blue'},
        id: 'pending',
      }
    });
  }

  render() {
    return (
      // $FlowFixMe not a ReactComponent
      <Remarkable
        {...this.props}
        {...this.state}
        setEditHandle={this.setEditHandle.bind(this)}
        setPendingEnd={this.setPendingEnd.bind(this)}
        setEditPos={this.setEditPos.bind(this)}
        stopEditing={this.stopEditing.bind(this)}
        finishCreating={this.finishCreating.bind(this)}
        startEditing={this.startEditing.bind(this)}
        startCreating={this.startCreating.bind(this)}
        finishEditMove={this.finishEditMove.bind(this)}
      />
    );
  }
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


