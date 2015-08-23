
import React from 'react';
import Remarkable from './Rem2';

import {fromJS} from 'immutable';
import calcSideCoords from './calcSideCoords';
import predraw from './predraw';

import type {Context, Mark, Lines, WordRef, WordPos, Pos, MarkID, DOMEvent, Verses, FontConfig, SizeConfig, Marks, SideCoords} from './types';


function invariant(val, message) {
  if (!val) throw new Error(message);
}

export default class Viewer extends React.Component {
  constructor(props) {
    super(props);

    var {lines, pos, img, height} = predraw(props.verses, props.size, props.font);
    // var sideCoords = calcSideCoords(marks.toJS(), pos, font, size);

    this.state = {
      lines,
      pos,
      height: height,
      baseImg: img,
      // sideCoords,
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
      // sideCoords: calcSideCoords(marks.toJS(), state.pos, fullState.font, fullState.size),
      editHandlePos: target,
    });
  }

  setEditHandle(handle) {
    this.setState({editHandle: handle});
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
      ...balance(state.pending),
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
      // sideCoords: calcSideCoords(marks.toJS(), state.pos, fullState.font, fullState.size),
      editing: null,
      editHandle: null,
    });
  }

  setMarkColor(color) {
    this.props.setMarkColor(this.state.editing, color);
  }

  render() {
    var actions = {};
    Object.getOwnPropertyNames(Viewer.prototype).forEach(name => {
      if (name !== 'constructor' && name !== 'render' && 'function' === typeof this[name]) {
        actions[name] = this[name].bind(this);
      }
    });
    return (
      <Remarkable
        {...this.props}
        {...actions}
        {...this.state}
      />
    );
  }
}

