
// import App from './App';

// React.render(<Provider store={store}><App/></Provider>, node);

// import Remarkable from './Remarkable';
import remarkup from './remarkup';

var canv = document.createElement('canvas');
document.body.appendChild(canv)
canv.width = 500
canv.height = 1500;
var ctx = canv.getContext('2d');
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

remarkup({
  width: 500,
  height: 1500,
  margin: 50,
}, ctx, verses, [{
  start: {verse: 0, word: 5},
  end: {verse: 0, word: 8},
  style: {
    color: 'red',
  },
}, {
  start: {verse: 0, word: 9},
  end: {verse: 1, word: 4},
  style: {
    color: 'blue',
  },
}], {
  family: 'serif',
  space: fontSize / 3,
  lineHeight: fontSize * 1.4,
  size: fontSize,
  indent: fontSize,
});
