
export default function drawText(ctx, font, size, verses) {
  var lines = [];
  var pos = [];
  var {width, height} = size;

  var top = font.size + size.vmargin;
  var left = size.hmargin + font.indent;
  var lineHeight = font.lineHeight;

  verses.forEach((verse, i) => {
    var wordPos = [];
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
      ctx.fillText(word, left, top);
      left += ww + font.space;
    });

    lines[lines.length - 1].right = left - font.space;
    top += lineHeight * 2;
    left = size.hmargin + font.indent;
  });
  return {lines, pos};
}

var widthCache = {};
function measure(text, ctx) {
  if (!widthCache[text]) {
    widthCache[text] = ctx.measureText(text);
  }
  return widthCache[text];
}

