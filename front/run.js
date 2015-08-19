
// import App from './App';

// React.render(<Provider store={store}><App/></Provider>, node);

// import Remarkable from './Remarkable';
import Remarkup from './remarkup';

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

function isGreater(pos1, pos2) {
  return (pos1.verse > pos2.verse) || (
    pos1.verse === pos2.verse &&
    pos1.word > pos2.word
  );
}

function balance(mark) {
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
      style: mark.style
    };
  }
  return mark;
}

var rem = new Remarkup(canv, verses, {
  size,
  font,
});

rem.draw(marks);

// rem.drawDebug();

var DEBUG = false;

if (DEBUG) {

  rem.on('move', target => {
    if (!target) return;
    rem.draw(marks.concat([{
      start: target,
      end: target,
      style: {color: 'green'},
    }]));
  });

} else {

  var pending = null;
  rem.on('down', target => {
    if (!target) return;
    if (target.word === false) {
      target = {verse: target.verse, word: target.left};
    }
    pending = {
      start: target,
      end: target,
      //type: 'sideline',
      style: {
        // underline: true,
        color: 'blue'
      },
    };
    var sub = rem.on('move', target => {
      if (!target || !pending) return;
      if (target.word === false) {
        target = {
          verse: target.verse,
          word: isGreater(pending.start, pending.end) ? target.left : target.right, // pickSide(pending.start, pending.end)
        };
      }
      pending.end = target;
      rem.draw(marks.concat([balance(pending)]));
    });
    var sub2 = rem.on('up', target => {
      sub(); sub2();
      marks.push(balance(pending));
      pending = null;
      rem.draw(marks);
    });
    rem.draw(marks.concat([pending]));
  });

}
