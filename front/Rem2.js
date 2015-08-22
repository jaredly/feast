/**
 * Marks of the form:
 *
 * {
 * }
 *
 * Text in split up things.
 * @flow
 */

import React from 'react';
import {fromJS} from 'immutable';

import drawMarks from './drawMarks';
import {getWordForPos} from './getMousePos';
import calcSideCoords from './calcSideCoords';
import drawEditHandles, {editHandleBoxes} from './drawEditHandles';
import predraw from './predraw';

import type {Context, Mark, Lines, WordRef, WordPos, Pos, MarkID, DOMEvent, Verses, FontConfig, SizeConfig, Marks, SideCoords} from './types';

function invariant(val, message) {
  if (!val) throw new Error(message);
}

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
    var sideCoords = this.calcMarks(marks, pos);

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

  calcMarks(marks: MarksMap, pos: Pos) {
    return calcSideCoords(marks.toJS(), pos, this.props.font, this.props.size);
  }

  setMarks(marks: MarksMap) {
    this.setState({
      marks,
      sideCoords: this.calcMarks(marks, this.state.pos)
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
    this.setMarks(marks);
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

type Props = {
  verses: Verses,
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

class Remarkable {
  props: Props;
  _canv: any;
  _ctx: Context;
  _press: any;
  _moved: mixed;
  _node: mixed;

  componentDidMount() {
    this.listenWindow();
    this._canv = React.findDOMNode(this._node);
    this._ctx = this._canv.getContext('2d');

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
      marks = marks.set('pending', balance(this.props.pending));
    }
    if (this.props.editing) {
      marks = marks.set(this.props.editing, balance(marks.get(this.props.editing).toJS()));
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
        drawEditHandles(this._ctx, balance(editMark.toJS()), this.props.lines, this.props.pos, this.props.font);
      }
    }
    if (this.props.pending) {
      drawEditHandles(this._ctx, balance(this.props.pending), this.props.lines, this.props.pos, this.props.font);
    }
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
    var mark = this.getEditing().toJS();
    if (target.word === false) {
      target = {
        verse: target.verse,
        word: isGreater(
          mark.start,
          mark.end
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
        word: isGreater(this.props.pending.start, this.props.pending.end) ?
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
    if (this.props.editing != null) {
      this.props.finishEditMove();
    }
  }

  marksAt(e: DOMEvent): Array<MarkID> {
    var target = this.wordAt(e);
    if (!target || target.word === false) {
      var sideline = this.getSideline(e);
      return sideline == null ? [] : [sideline];
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
    var {width, height} = this.props.size;
    return (
      <canvas
        style={styles.canv}
        width={width}
        height={height}
        onMouseDown={this.onMouseDown.bind(this)}
        onClick={this.onClick.bind(this)}
        ref={c => this._node = c}
      />
    );
  }
};

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

