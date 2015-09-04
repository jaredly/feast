
import React from 'react';
import Remarkable from './Rem2';

import {fromJS, Set} from 'immutable';
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
    if (this.state.pending.get('end').equals(end)) {
      return;
    }
    this.setState({
      pending: this.state.pending.set('end', fromJS(end)),
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
    var current = this.state.editHandlePos;
    if (target.verse === current.get('verse') &&
        target.word === current.get('word')) {
      return;
    }

    this.setState({
      editHandlePos: fromJS(target),
    });
  }

  setEditHandle(handle) {
    this.setState({
      editHandle: handle,
      editHandlePos: this.props.marks.getIn([this.state.editing, handle]),
    });
  }

  finishEditMove() {
    if (!this.state.editHandle) {
      return;
    }
    var mark = this.props.marks.get(this.state.editing).set(this.state.editHandle, this.state.editHandlePos);
    if (isGreaterIm(mark.get('start'), mark.get('end'))) {
      this.props.setMarkEnds(
        this.state.editing,
        mark.get('end'),
        mark.get('start')
      );
    } else {
      this.props.setMarkPos(
        this.state.editing,
        this.state.editHandle,
        this.state.editHandlePos
      );
    }
    this.setState({
      editHandlePos: null,
      editHandle: null,
    });
  }

  finishCreating() {
    var id = gen();
    invariant(this.state.pending);
    this.props.addMark(balance(myToJS(this.state.pending.set('id', id))));
    this.setState({
      pending: null,
      editHandle: null,
      editing: id,
    });
  }

  startCreating(target) {
    this.setState({
      editing: null,
      pending: fromJS({
        start: target,
        end: target,
        node_uri_start: this.props.uri,
        node_uri_end: this.props.uri,
        study_id: this.props.study,
        type: 'highlight',
        style: {color: 'blue'},
        tags: Set(),
        id: 'pending',
      })
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

  cancelEdit() {
    this.setState({editing: null, editHandle: null});
  }

  removeTag(tid) {
    this.props.removeTag(this.state.editing, tid);
  }

  addTag(tid) {
    this.props.addTag(this.state.editing, tid);
  }

  newTag(text) {
    var namespace, name;
    if (text.indexOf(':') !== -1) {
      [namespace, name] = text.split(':');
    } else {
      name = text;
      namespace = '';
    }
    this.props.createAndAddTag(gen(), this.state.editing, namespace, name, randColor());
  }

  createNote() {
    this.props.createNote(gen(), this.state.editing, '');
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
      marks = marks.set(this.state.editing, balanceIm(marks.get(this.state.editing).set(this.state.editHandle, this.state.editHandlePos)));
    }
    return (
      <Remarkable
        {...this.props}
        {...actions}
        sideCoords={memoSideCoords(marks, this.state.pos, this.props.font, this.props.size)}
        {...this.state}
        marks={marks}
        verses={this.props.verses}
      />
    );
  }
}

var COLORS = ['red', 'green', 'blue', 'orange', 'purple', 'brown'];
function randColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

var _coords = new Map();
function memoSideCoords(marks, pos, font, size) {
  if (!_coords.has(marks)) {
    _coords.set(marks, calcSideCoords(marks.toJS(), pos, font, size));
  }
  return _coords.get(marks);
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

function gen() {
  return Math.random().toString(16).slice(2);
}

