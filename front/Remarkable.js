
/**
 * Marks of the form:
 *
 * {
 * }
 *
 * Text in split up things.
 */

import React from 'react';
import remarkup from './remarkup';

export default class Remarkable {
  componentDidMount() {
    this._render();
  }
  _render() {
    var ctx = this._canv.getContext('2d');
    remarkup(this.props.size, ctx, this.props.verses, [], this.props.font);
  }
  render() {
    var {width, height} = this.props.size;
    return <canvas width={width} height={height} ref={c => this._canv = c} />;
    /*
    var marks = this.props.marks;
    var atMark = 0;
    var fromMark = 0;
    var chunks = this.props.words.map((word, i) => {
      var style = {
        ...styles.word,
      };
      marks.forEach(m => {
        if (m.start > i || m.end < i) {
          return;
        }
        // todo merge colors
        if (m.style === 'highlight') {
          style.backgroundColor = m.color;
        } else if (m.style === 'underline') {
          style.borderBottomColor = m.color;
        }
        topMark = m.id;
      });
      return (
        <span
          key={word + '_' + i}
          onMouseOver={() => move(i)}
          onMouseUp={() => up(i)}
          onClick={() => click(i)}
        >
          {word}
        </span>
      );
    });
    return (
      <span style={styles.words}>
        {chunks}
      </span>
    );
    */
  }
};

var styles = {
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

