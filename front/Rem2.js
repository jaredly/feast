/**
 * @flow
 */

import React from 'react';

import drawMarks from './drawMarks';
import {getWordForPos} from './getMousePos';
import calcSideCoords from './calcSideCoords';
import drawEditHandles, {editHandleBoxes} from './drawEditHandles';
import Editorial from './Editorial';
import drawNotes from './drawNotes';
import drawOver from './drawOver';

import type {Context, Mark, Lines, WordRef, WordPos, Pos, MarkID, DOMEvent, FontConfig, SizeConfig, Marks, SideCoords} from './types';

type Props = {
  font: FontConfig,
  size: SizeConfig,

  // state
  marks: MarksMap,
  sideCoords: SideCoords,
  pos: Pos,
  lines: Lines,
  editing: ?MarkID,
  editHandle: ?('start' | 'end'),
  pending: ?Mark,
  baseImg: any,

  // actions
  setEditHandle: (handle: 'start' | 'end') => void,
  setPendingEnd: (end: WordRef) => void,
  setEditPos: (target: WordRef) => void,
  stopEditing: () => void,
  finishCreating: () => void,
  startEditing: (id: MarkID) => void,
  startCreating: (target: WordRef) => void,
  finishEditMove: () => void,
};

type MarksMap = {
  [key: string]: mixed,
  toJS: () => Marks,
};

type MarkMap = {
  [key: string]: mixed,
  toJS: () => Mark,
};

export default class Remarkable {
  props: Props;

  _canv: any;
  _ctx: Context;
  _press: any;
  _moved: mixed;
  _node: mixed;
  _noteCoords: {[key: string]: {top: number, left: number, bottom: number, right: number}};

  componentDidMount() {
    this.listenWindow();
    this._canv = React.findDOMNode(this._node);
    this._ctx = this._canv.getContext('2d');
    this._noteCoords = {};

    this.draw();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps !== this.props) {
      this.draw();
    }
  }

  listenWindow() {
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  draw() {
    this._ctx.clearRect(0, 0, this._canv.width, this._canv.height);
    var marks = this.props.marks;
    if (this.props.pending) {
      marks = marks.set('pending', balanceIm(this.props.pending));
    }
    if (this.props.editing) {
      marks = marks.set(this.props.editing, balanceIm(marks.get(this.props.editing)));
    }

    drawMarks(
      this._ctx,
      this.props.lines,
      this.props.pos,
      this.props.sideCoords,
      marks.toJS(),
      this.props.font,
      this.props.size,
      this.props.editing
    );
    this._ctx.globalAlpha = 1;
    this._ctx.drawImage(this.props.baseImg, 0, 0);
    if (this.props.editing != null) {
      var editMark = this.getEditing();
      if (editMark != null) {
        drawEditHandles(this._ctx, balanceIm(editMark).toJS(), this.props.lines, this.props.pos, this.props.font);
      }
    }
    if (this.props.pending) {
      drawEditHandles(this._ctx, balanceIm(this.props.pending).toJS(), this.props.lines, this.props.pos, this.props.font);
    }
    marks.forEach(mark => {
      if (mark.get('type') === 'outline') {
        drawOver(this._ctx, mark.toJS(), this.props.verses, this.props.lines, this.props.pos, this.props.font);
      }
    });
    marks.forEach(mark => {
      if (mark.get('type') === 'color') {
        drawOver(this._ctx, mark.toJS(), this.props.verses, this.props.lines, this.props.pos, this.props.font);
      }
    });
    this._noteCoords = drawNotes(
      this._ctx,
      this.props.notes.toJS(),
      marks.toJS(),
      this.props.tags.toJS(),
      this.props.pos,
      this.props.sideCoords,
      this.props.size,
      this.props.editing
    );
  }

  getEditing(): MarkMap {
    return this.props.marks.get(this.props.editing);
  }

  wordAt(e: DOMEvent) {
    var {x, y} = this.eventPos(e);
    return getWordForPos(x, y, this.props.size, this.props.font, this.props.lines, this.props.pos);
  }

  eventPos(e: DOMEvent): {x: number, y: number} {
    var rect = this._canv.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    return {x, y};
  }

  cursorAt(e: DOMEvent): string {
    if (this.props.editing != null) {
      var handle = this.checkEditHandle(e);
      if (handle) {
        return 'pointer';
      }
    }
    var target = this.wordAt(e);
    if (!target || target.word === false) {
      if (this.getSideline(e) != null) {
        return 'pointer';
      } else if (this.getNote(e) != null) {
        return 'pointer';
      }
      return 'default';
    } else if (this.marksFor(target).length) {
      return 'pointer';
    }
    return 'text';
  }

  getSideline(e: DOMEvent): ?MarkID {
    var {x, y} = this.eventPos(e);
    for (var id in this.props.sideCoords) {
      var {top, bottom, left} = this.props.sideCoords[id];
      if (top <= y && y <= bottom && Math.abs(x - left) < this.props.font.space / 2) {
        return id;
      }
    }
    return null;
  }

  getNote(e: DOMEvent): ?MarkID {
    var {x, y} = this.eventPos(e);
    for (var mid in this._noteCoords) {
      var box = this._noteCoords[mid];
      if (box.top <= y && y <= box.bottom &&
          box.left <= x && x <= box.right) {
        return mid;
      }
    }
  }

  // TODO can I get some flow goodness in here?
  marksFor(target: WordRef): Array<MarkID> {
    return this.props.marks.filter(mark =>
      mark.get('type') !== 'sideline' &&
      (mark.getIn(['start', 'verse']) < target.verse ||
       (mark.getIn(['start', 'verse']) === target.verse &&
        mark.getIn(['start', 'word']) <= target.word)) &&
      (mark.getIn(['end', 'verse']) > target.verse ||
       (mark.getIn(['end', 'verse']) === target.verse &&
        mark.getIn(['end', 'word']) >= target.word))
    ).keySeq().toArray(); // TODO remove?
  }

  checkEditHandle(e: DOMEvent): ?('start' | 'end') {
    var pos = this.eventPos(e);
    var mark = this.getEditing();
    if (!mark) {
      return;
    }
    mark = mark.toJS();
    var startPos = this.props.pos[mark.start.verse][mark.start.word];
    var endPos = this.props.pos[mark.end.verse][mark.end.word];
    var {start, end} = editHandleBoxes(startPos, endPos, this.props.font);

    if (pointInBox(pos, start)) {
      return 'start';
    }
    if (pointInBox(pos,end)) {
      return 'end';
    }
  }

  onMouseDown(e: DOMEvent) {
    if (this.props.editing != null) {
      // check edit handles
      var handle = this.checkEditHandle(e);
      if (handle) {
        this._moved = true;
        this._press = handle;
        this.props.setEditHandle(handle);
        return;
      }
    }
    var target = this.wordAt(e);
    if (target && target.word !== false) {
      this._press = {x: e.pageX, y: e.pageY, target};
      this._canv.style.cursor = 'pointer';
    }
  }

  onMouseMove(e: DOMEvent) {
    if (!this._press) {
      this._canv.style.cursor = this.cursorAt(e);
      return;
    }
    if (this.props.editHandle) {
      this.moveEditHandle(e);
    } else {
      this.movePending(e);
    }
  }

  moveEditHandle(e: DOMEvent) {
    var target = this.wordAt(e);
    if (!target) {
      return;
    }
    var mark = this.getEditing();
    var other = this.props.editHandle === 'start' ? 'end' : 'start';
    if (target.word === false) {
      target = {
        verse: target.verse,
        word: isGreaterIm(
          mark.get(other),
          mark.get(this.props.editHandle)
        ) ? target.left : target.right,
      };
    }
    this.props.setEditPos(target);
  }

  movePending(e: DOMEvent) {
    if (!this.props.pending) {
      if (Math.abs(e.pageX - this._press.x) +
          Math.abs(e.pageY - this._press.y) < 10) {
        return;
      }
      this._moved = true;
      this.props.startCreating(this._press.target);
      return;
    }
    var target = this.wordAt(e);
    if (!target) {
      return;
    }
    if (target.word === false) {
      target = {
        verse: target.verse,
        // $FlowFixMe this.state.pending is not null
        word: isGreaterIm(this.props.pending.get('start'), this.props.pending.get('end')) ?
          target.left : target.right,
      };
    }
    this.props.setPendingEnd(target);
  }

  onMouseUp(e: DOMEvent) {
    this._press = false;
    if (this.props.pending) {
      this.props.finishCreating();
    }
    if (this.props.editing != null && this.props.editHandle != null) {
      this.props.finishEditMove();
    }
  }

  marksAt(e: DOMEvent): Array<MarkID> {
    var target = this.wordAt(e);
    if (!target || target.word === false) {
      var sideline = this.getSideline(e);
      if (sideline != null) {
        return [sideline];
      }
      var notemark = this.getNote(e);
      return notemark == null ? [] : [notemark];
    }
    return this.marksFor(target);
  }

  onClick(e: DOMEvent) {
    if (this._moved) {
      this._moved = false;
      return;
    }
    this._moved = false;
    var marks = this.marksAt(e);
    if (!marks.length) {
      if (this.props.editing != null) {
        this.props.stopEditing();
      }
      return;
    }
    // TODO show selection dialog for multiple?
    this.props.startEditing(marks[0]);
  }

  render(): ReactElement {
    var {width} = this.props.size;
    var height = this.props.height;
    return (
      <div>
        <canvas
          style={styles.canv}
          width={width}
          height={height}
          onMouseDown={this.onMouseDown.bind(this)}
          onClick={this.onClick.bind(this)}
          ref={c => this._node = c}
        />
        {this.props.editing != null && <Editorial
          mark={this.props.marks.get(this.props.editing)}
          notes={getNotesFor(this.props.editing, this.props.notes)}
          tags={this.props.tags}
          addTag={this.props.addTag}
          newTag={this.props.newTag}
          setMarkStyle={this.props.setMarkStyle}
          setMarkColor={this.props.setMarkColor}
          createNote={this.props.createNote}
          removeTag={this.props.removeTag}
          changeNote={this.props.changeNote}
          removeNote={this.props.removeNote}
          removeMark={this.props.removeMark}
          cancelEdit={this.props.cancelEdit}
        />}
      </div>
    );
  }
};

function getNotesFor(id, notes) {
  return notes.filter(val => val.get('mark') === id);
}

var styles = {
  canv: {
    backgroundColor: 'white',
    margin: 40,
  },

  words: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  word: {
    padding: '5px 2px',
    margin: '2px 0',
  },
};

function pointInBox(pos, box) {
  return (
    box.x <= pos.x && pos.x <= box.x + box.width &&
    box.y <= pos.y && pos.y <= box.y + box.height
  );
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


