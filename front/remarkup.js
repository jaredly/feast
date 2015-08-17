
export default function remarkup(size, ctx, verses, marks, font) {
  ctx.font = font.size + 'px ' + font.family;
  var {width, height} = size;

  var top = font.size + size.margin;;
  var left = size.margin + font.indent;
  var lineHeight = font.lineHeight;

  verses.forEach((verse, i) => {
    var words = verse.words;
    words.forEach((word, w) => {
      var ww = measure(word, ctx).width;
      if (left + font.space + ww > width - size.margin) {
        top += lineHeight;
        left = size.margin;
      }
      ctx.fillText(word, left, top);
      left += ww + font.space;
    });

    top += lineHeight * 2;
    left = size.margin + font.indent;
  });
}

var widthCache = {};
function measure(text, ctx) {
  if (!widthCache[text]) {
    widthCache[text] = ctx.measureText(text);
  }
  return widthCache[text];
}
