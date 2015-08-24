
import React from 'react';
import Remarkable from './Rem2';

import {fromJS} from 'immutable';
import calcSideCoords from './calcSideCoords';
import predraw from './predraw';

import type {Context, Mark, Lines, WordRef, WordPos, Pos, MarkID, DOMEvent, Verses, FontConfig, SizeConfig, Marks, SideCoords} from './types';


function invariant(val, message) {
  if (!val) throw new Error(message);
}

var MID = 1000;

export default class Viewer extends React.Component {
  constructor(props) {
    super(props);

    var {lines, pos, img, height} = predraw(props.verses, props.size, props.font);

    this.state = {
      lines,
      pos,
      height,
      baseImg: img,
      editing: null,
      editHandle: null,
      editHandlePos: null,
      pending: null,
    };
  }

  setPendingEnd(end) {
    invariant(this.state.pending, 'Cannot set pending end if no pending mark');
    if (this.state.pending.end.verse === end.verse &&
        this.state.pending.end.word === end.word) {
      return;
    }
    this.setState({
      pending: {
        ...this.state.pending,
        end,
      }
    });
  }

  stopEditing() {
    this.setState({editing: null});
  }

  startEditing(id) {
    this.setState({
      editing: id,
    });
  }

  setEditPos(target) {
    var current = this.props.marks.getIn([this.state.editing, this.state.editHandle]);
    if (target.verse === current.get('verse') &&
        target.word === current.get('word')) {
      return;
    }
    // var marks = this.props.marks.setIn([this.state.editing, this.state.editHandle], fromJS(target));

    this.setState({
      editHandlePos: target,
    });
  }

  setEditHandle(handle) {
    this.setState({
      editHandle: handle,
      editHandlePos: this.props.marks.getIn([this.state.editing, handle]).toJS(),
    });
  }

  finishEditMove() {
    if (!this.state.editHandle) {
      return;
    }
    var editing = this.props.marks.get(this.state.editing).set(this.state.editHandle, fromJS(this.state.editHandlePos));
    // var marks = this.props.marks.set(this.state.editing, fromJS(balance(editing.toJS())))
    this.props.setMarkPos(this.state.editing, this.state.editHandle, fromJS(this.state.editHandlePos));
    // todo sidelines recalc?
    // this.props.setMarks(marks);
    this.setState({
      editHandlePos: null,
      editHandle: null,
    });
  }

  finishCreating() {
    var id = MID++ + '';
    invariant(this.state.pending);
    this.props.addMark(fromJS({
      ...balance(this.state.pending),
      id,
    }));
    this.setState({
      pending: null,
      editHandle: null,
      editing: id,
    });
  }

  startCreating(target) {
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

  removeMark() {
    this.props.removeMark(this.state.editing);
    this.setState({
      editing: null,
      editHandle: null,
    });
  }

  setMarkColor(color) {
    this.props.setMarkColor(this.state.editing, color);
  }

  setMarkStyle(style) {
    this.props.setMarkStyle(this.state.editing, style);
  }

  render() {
    var actions = {};
    Object.getOwnPropertyNames(Viewer.prototype).forEach(name => {
      if (name !== 'constructor' && name !== 'render' && 'function' === typeof this[name]) {
        actions[name] = this[name].bind(this);
      }
    });
    var marks = this.props.marks;
    if (this.state.editHandle) {
      marks = marks.set(this.state.editing, fromJS(balance(marks.get(this.state.editing).set(this.state.editHandle, this.state.editHandlePos).toJS())));
    }
    return (
      <Remarkable
        {...this.props}
        {...actions}
        sideCoords={memoSideCoords(marks, this.state.pos, this.props.font, this.props.size)}
        {...this.state}
        marks={marks}
      />
    );
  }
}

var _coords = new Map();
function memoSideCoords(marks, pos, font, size) {
  if (!_coords.has(marks)) {
    _coords.set(marks, calcSideCoords(marks.toJS(), pos, font, size));
  }
  return _coords.get(marks);
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
