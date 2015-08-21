
// import App from './App';

// React.render(<Provider store={store}><App/></Provider>, node);

import {Map} from 'immutable';
import React from 'react';
import Remarkable from './Rem2';

var dict = ['dolor', 'sit', 'amet', 'lorem', 'ipsum', 'awesome', 'cheeses', 'verily', 'I,'];

function make_varse() {
  var len = 10 + parseInt(Math.random() * 40);
  var words = [];
  for (var i=0; i<len; i++) {
    words.push(dict[parseInt(Math.random() * dict.length)]);
  }
  return {words};
}

var verses = [];
for (var i=0; i<20; i++) {
  verses.push(make_varse());
}

var size = {
  width: 700,
  height: 1000,
  vmargin: 50,
  hmargin: 100,
};
var fontSize = 25;
var font = {
  family: 'serif',
  space: fontSize / 3,
  lineHeight: fontSize * 1.4,
  size: fontSize,
  indent: fontSize,
};

var node = document.createElement('div');
document.body.appendChild(node)

React.render(<Remarkable font={font} verses={verses} size={size} />, node);

/*
  rem.on('mark:click', (target, e) => {
    if (pending) return;
  });

  var pending = null;
  rem.on('down', (target, e) => {
    if (!target) return;
    if (target.word === false) {
      target = {verse: target.verse, word: target.left};
    }
    var initialTarget = target;
    var ix = e.pageX;
    var iy = e.pageY;
    var sub = rem.on('move', (target, e) => {
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
        rem.setMarks(marks.concat([balance(pending)]));
        return;
      }
      if (target.word === false) {
        target = {
          verse: target.verse,
          word: isGreater(pending.start, pending.end) ? target.left : target.right, // pickSide(pending.start, pending.end)
        };
      }
      pending.end = target;
      rem.setMarks(marks.concat([balance(pending)]));
    });
    var sub2 = rem.on('up', target => {
      sub(); sub2();
      if (pending) {
        marks.push(balance(pending, MID++));
        pending = null;
        rem.setMarks(marks);
      }
    });
    // rem.setMarks(marks.concat([pending]));
  });

}
*/
