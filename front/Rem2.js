
/**
 * Marks of the form:
 *
 * {
 * }
 *
 * Text in split up things.
 */

import React from 'react';
import Remarkup from './remarkup';

import drawText from './drawText';
import drawMarks from './drawMarks';
import getMousePos, {getWordForPos} from './getMousePos';
import calcSideCoords from './calcSideCoords';
import drawEditHandles, {editHandleBoxes} from './drawEditHandles';

/*
var marks = [{
  start: {verse: 0, word: 5},
  end: {verse: 0, word: 8},
  style: {
    color: 'red',
    underline: true,
  },
}, {
  start: {verse: 3, word: 1},
  end: {verse: 3, word: 8},
  style: {
    color: 'green',
  },
}, {
  start: {verse: 0, word: 7},
  end: {verse: 2, word: 4},
  type: 'sideline',
  style: {
    color: 'blue',
    underline: true,
  },
}];
*/

var sidelines = [{
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

var marks = sidelines;
var MID = 0;
marks.forEach(mark => mark.id = MID++);

export default class Remarkable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {marks};
  }

  componentWillMount() {
    this._img = document.createElement('img');
    var {lines, pos} = this.predraw(this.props.verses);
    var sideCoords = this.calcMarks(this.state.marks, pos);
    this.setState({lines, pos, sideCoords});
  }

  componentDidMount() {
    this.listenWindow();
    this._canv = React.findDOMNode(this._node);
    this._ctx = this._canv.getContext('2d');

    this.draw();
  }

  setMarks(marks) {
    var sideCoords = this.calcMarks(marks, this.state.pos);
    this.setState({marks, sideCoords});
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState !== this.state) {
      this.draw();
    }
  }

  calcMarks(marks, pos) {
    return calcSideCoords(marks, pos, this.props.font, this.props.size);
  }

  predraw(verses) {
    var canv = document.createElement('canvas');
    canv.height = this.props.size.height;
    canv.width = this.props.size.width;
    var ctx = canv.getContext('2d');
    ctx.clearRect(0, 0, this.props.size.width, this.props.size.height);
    ctx.fillStyle = 'black';
    ctx.globalAlpha = 1;
    ctx.font = this.props.font.size + 'px ' + this.props.font.family;
    var {lines, pos} = drawText(ctx, this.props.font, this.props.size, this.props.verses);
    this._img.src = canv.toDataURL();
    return {lines, pos};
  }

  draw() {
    this._ctx.clearRect(0, 0, this._canv.width, this._canv.height);
    var marks = this.state.marks;
    if (this.state.pending) {
      marks = marks.concat([balance(this.state.pending)]);
    }
    if (this.state.editing) {
      marks = marks.map(mark => mark.id === this.state.editing ?
                        balance(mark) : mark);
    }
    drawMarks(
      this._ctx,
      this.state.lines,
      this.state.pos,
      this.state.sideCoords,
      marks,
      this.props.font,
      this.props.size,
      this.state.editing
    );
    this._ctx.globalAlpha = 1;
    this._ctx.drawImage(this._img, 0, 0);
    if (this.state.editing != null) {
      var editMark = this.getEditing();
      if (editMark != null) {
        drawEditHandles(this._ctx, balance(editMark), this.state.lines, this.state.pos, this.props.font);
      }
    }
    if (this.state.pending) {
      drawEditHandles(this._ctx, balance(this.state.pending), this.state.lines, this.state.pos, this.props.font);
    }
  }

  getEditing() {
    var editMark = null;
    this.state.marks.some(mark => {
      if (mark.id === this.state.editing) {
        editMark = mark;
        return true;
      }
    })
    return editMark;
  }

  wordAt(e) {
    var {x, y} = this.eventPos(e);
    return getWordForPos(x, y, this.props.size, this.props.font, this.state.lines, this.state.pos);
  }

  eventPos(e) {
    var rect = this._canv.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    return {x, y};
  }

  cursorAt(e) {
    if (this.state.editing != null) {
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
      // TODO check for sideline
    } else if (this.marksFor(target).length) {
      return 'pointer';
    }
    return 'text';
  }

  getSideline(e) {
    var {x, y} = this.eventPos(e);
    for (var id in this.state.sideCoords) {
      var {top, bottom, left} = this.state.sideCoords[id];
      if (top <= y && y <= bottom && Math.abs(x - left) < this.props.font.space / 2) {
        return +id;
      }
    }
    return null;
  }

  marksFor(target) {
    return this.state.marks.filter(mark =>
      mark.type !== 'sideline' &&
      (mark.start.verse < target.verse ||
       (mark.start.verse === target.verse &&
        mark.start.word <= target.word)) &&
      (mark.end.verse > target.verse ||
       (mark.end.verse === target.verse &&
        mark.end.word >= target.word))
    ).map(m => m.id);
  }

  checkEditHandle(e) {
    var pos = this.eventPos(e);
    var mark = this.getEditing();
    if (!mark) {
      return;
    }
    var startPos = this.state.pos[mark.start.verse][mark.start.word];
    var endPos = this.state.pos[mark.end.verse][mark.end.word];
    var {start, end} = editHandleBoxes(startPos, endPos, this.props.font);

    if (pointInBox(pos, start)) {
      return 'start';
    }
    if (pointInBox(pos,end)) {
      return 'end';
    }
  }

  onMouseDown(e) {
    if (this.state.editing != null) {
      // check edit handles
      var handle = this.checkEditHandle(e);
      if (handle) {
        this._moved = true;
        this._press = handle;
        this.setState({
          editHandle: handle,
        });
        return;
      }
    }
    var target = this.wordAt(e);
    if (target && target.word !== false) {
      this._press = {x: e.pageX, y: e.pageY, target};
      this._canv.style.cursor = 'pointer';
    }
  }

  onMouseMove(e) {
    if (!this._press) {
      this._canv.style.cursor = this.cursorAt(e);
      return;
    }
    if (this.state.editHandle) {
      this.moveEditHandle(e);
    } else {
      this.movePending(e);
    }
  }

  moveEditHandle(e) {
    var target = this.wordAt(e);
    if (!target) {
      return;
    }
    var mark = this.getEditing();
    if (target.word === false) {
      target = {
        verse: target.verse,
        word: isGreater(
          mark.start,
          mark.end
        ) ? target.left : target.right,
      };
    }
    mark[this.state.editHandle] = target;
    this.setState({marks: this.state.marks, sideCoords: this.calcMarks(this.state.marks, this.state.pos)});
  }

  movePending(e) {
    if (!this.state.pending) {
      if (Math.abs(e.pageX - this._press.x) +
          Math.abs(e.pageY - this._press.y) < 10) {
        return;
      }
      this._moved = true;
      this.setState({
        editing: null,
        pending: {
          start: this._press.target,
          end: this._press.target,
          style: {color: 'blue'},
          id: 'pending',
        }
      });
      return;
    }
    var target = this.wordAt(e);
    if (!target) {
      return;
    }
    if (target.word === false) {
      target = {
        verse: target.verse,
        word: isGreater(
          this.state.pending.start,
          this.state.pending.end
        ) ? target.left : target.right,
      };
    }
    this.setState({pending: {
      ...this.state.pending,
      end: target,
    }});
  }

  onMouseUp(e) {
    this._press = false;
    if (this.state.pending) {
      var id = MID++;
      this.setState({
        marks: this.state.marks.concat([{
          ...balance(this.state.pending),
          id,
        }]),
        pending: null,
        editHandle: null,
        editing: id,
      });
    }
    if (this.state.editing != null) {
      for (var i=0; i<this.state.marks.length; i++) {
        if (this.state.marks[i].id === this.state.editing) {
          this.state.marks.splice(i, 1, balance(this.state.marks[i]));
        }
      }
      // todo sidelines recalc
      this.setState({
        marks: this.state.marks,
        editHandle: null,
      });
    }
  }

  listenWindow() {
    window.addEventListener('mousemove', ::this.onMouseMove);
    window.addEventListener('mouseup', ::this.onMouseUp);
  }

  marksAt(e) {
    var target = this.wordAt(e);
    if (!target || target.word === false) {
      var sideline = this.getSideline(e);
      return sideline == null ? [] : [sideline];
    }
    return this.marksFor(target);
  }

  onClick(e) {
    if (this._moved) {
      this._moved = false;
      return;
    }
    this._moved = false;
    var marks = this.marksAt(e);
    if (!marks.length) {
      if (this.state.editing != null) {
        this.setState({editing: null});
      }
      return;
    }
    console.log('click', marks);
    // TODO show selection dialog for multiple?
    this.setState({
      editing: marks[0],
    });
  }

  render() {
    var {width, height} = this.props.size;
    return (
      <canvas
        style={styles.canv}
        width={width}
        height={height}
        onMouseDown={::this.onMouseDown}
        onClick={::this.onClick}
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

