
// import App from './App';

// React.render(<Provider store={store}><App/></Provider>, node);

// import Remarkable from './Remarkable';
import Remarkup from './remarkup';

var canv = document.createElement('canvas');
document.body.appendChild(canv)
canv.width = 500
canv.height = 1500;
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

var size = {
  width: 500,
  height: 1500,
  margin: 50,
};
var font = {
  family: 'serif',
  space: fontSize / 3,
  lineHeight: fontSize * 1.4,
  size: fontSize,
  indent: fontSize,
};

function balance(mark) {
  if (mark.end.verse < mark.start.verse ||
      (mark.end.verse === mark.start.verse &&
       mark.end.word < mark.start.word)) {
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
    pending = {
      start: target,
      end: target,
      style: {
        // underline: true,
        color: 'blue'
      },
    };
    var sub = rem.on('move', target => {
      if (!target || !pending) return;
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
