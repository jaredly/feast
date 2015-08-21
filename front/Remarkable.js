
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

  componentDidMount() {
    this.rem = new Remarkup(React.findDOMNode(this._canv), this.props.verses, this.state.marks, {
      size: this.props.size,
      font: this.props.font,
    });
    var pending = null;
    this.rem.on('down', (target, e) => {
      if (!target) return;
      if (target.word === false) {
        target = {verse: target.verse, word: target.left};
      }
      var initialTarget = target;
      var ix = e.pageX;
      var iy = e.pageY;
      var sub = this.rem.on('move', (target, e) => {
        if (!pending) {
          if (Math.abs(e.pageX - ix) + Math.abs(e.pageY - iy) < 10) {
            return;
          }
          pending = {
            start: initialTarget,
            end: initialTarget,
            id: 'PEND',
            //type: 'sideline',
            style: {
              // underline: true,
              color: 'blue'
            },
          };
        }
        if (!target) {
          this.rem.setMarks(marks.concat([balance(pending)]));
          return;
        }
        if (target.word === false) {
          target = {
            verse: target.verse,
            word: isGreater(pending.start, pending.end) ? target.left : target.right, // pickSide(pending.start, pending.end)
          };
        }
        pending.end = target;
        this.rem.setMarks(marks.concat([balance(pending)]));
      });
      var sub2 = this.rem.on('up', target => {
        sub(); sub2();
        if (pending) {
          marks.push(balance(pending, MID++));
          pending = null;
          this.rem.setMarks(marks);
        }
      });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.marks !== prevState.marks) {
      this.rem.setMarks(this.state.marks);
    }
  }

  render() {
    var {width, height} = this.props.size;
    return <canvas style={styles.canv} width={width} height={height} ref={c => this._canv = c} />;
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

function isGreater(pos1, pos2) {
  return (pos1.verse > pos2.verse) || (
    pos1.verse === pos2.verse &&
    pos1.word > pos2.word
  );
}

function balance(mark, id) {
  if (isGreater(mark.start, mark.end)) {
    /*
  if (mark.end.verse < mark.start.verse ||
      (mark.end.verse === mark.start.verse &&
       mark.end.word < mark.start.word)) {
       */
    return {
      start: mark.end,
      end: mark.start,
      type: mark.type,
      style: mark.style,
      id,
    };
  }
  if (id) {
    return {...mark, id};
  }
  return mark;
}

