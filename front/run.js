
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
