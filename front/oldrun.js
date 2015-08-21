
// import App from './App';

// React.render(<Provider store={store}><App/></Provider>, node);

// import Remarkable from './Remarkable';
import Remarkup from './Rem2';

var WIDTH = 700;
var HEIGHT = 1500;

var canv = document.createElement('canvas');
document.body.appendChild(canv)
canv.width = WIDTH
canv.height = HEIGHT;
canv.style.backgroundColor = 'white';
canv.style.margin = '40px';

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

var fontSize = 25;

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

var size = {
  width: WIDTH,
  height: HEIGHT,
  vmargin: 50,
  hmargin: 100,
};
var font = {
  family: 'serif',
  space: fontSize / 3,
  lineHeight: fontSize * 1.4,
  size: fontSize,
  indent: fontSize,
};

var MID = 0;
marks.forEach(mark => mark.id = MID++);

var rem = new Remarkup(canv, verses, marks, {
  size,
  font,
});

// rem.drawDebug();

var DEBUG = false;

if (DEBUG) {

  rem.on('move', target => {
    if (!target) return;
    rem.setMarks(marks.concat([{
      start: target,
      end: target,
      style: {color: 'green'},
    }]));
  });

} else {

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
