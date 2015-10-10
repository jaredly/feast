/**
 * @ flow
 */

import type {Context, FontConfig, SizeConfig, Verses, Lines, Pos} from './types';

export default function measureText(ctx: Context, font: FontConfig, size: SizeConfig, verses: Verses): {lines: Lines, pos: Pos} {
  var lines = [];
  var pos = [];
  var {width} = size;

  var top = font.size + size.vmargin;
  var left = size.hmargin + font.indent;
  var lineHeight = font.lineHeight;

  verses.forEach((verse, i) => {
    var wordPos = [];
    wordPos.numberLeft = left;
    left += measure(verse.num, ctx).width + font.space + font.space;
    pos.push(wordPos);
    var words = verse.words;
    lines.push({
      verse: i,
      word: 0,
      top,
      left,
      right: 0,
    });
    words.forEach((word, w) => {
      var ww = measure(word, ctx).width;
      if (left + font.space + ww > width - size.hmargin) {
        lines[lines.length - 1].right = left - font.space;
        top += lineHeight;
        left = size.hmargin;
        lines.push({
          verse: i,
          word: w,
          top,
          left,
          right: 0,
        });
      }
      wordPos.push({left, top, width: ww, line: lines.length - 1});
      left += ww + font.space;
    });

    lines[lines.length - 1].right = left - font.space;
    top += lineHeight * 2;
    left = size.hmargin + font.indent;
  });
  return {lines, pos, height: top + size.vmargin};
}

var widthCache = {};
function measure(text, ctx) {
  if (!widthCache[text]) {
    widthCache[text] = ctx.measureText(text);
  }
  return widthCache[text];
}


