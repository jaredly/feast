
export default function remarkup(size, ctx, verses, marks, font) {
  ctx.font = font.size + 'px ' + font.family;
  var {width, height} = size;

  var top = font.size + size.margin;;
  var left = size.margin + font.indent;
  var lineHeight = font.lineHeight;

  var lines = [];
  var pos = [];

  ctx.fillStyle = 'black';
  ctx.globalAlpha = 1;
  verses.forEach((verse, i) => {
    var wordPos = [];
    pos.push(wordPos);
    var words = verse.words;
    lines.push([i, 0, top, left]);
    words.forEach((word, w) => {
      var ww = measure(word, ctx).width;
      if (left + font.space + ww > width - size.margin) {
        lines[lines.length - 1].push(left);
        top += lineHeight;
        left = size.margin;
        lines.push([i, w, top, left]);
      }
      wordPos.push({left, top, width: ww, line: lines.length - 1});
      ctx.fillText(word, left, top);
      left += ww + font.space;
    });

    top += lineHeight * 2;
    left = size.margin + font.indent;
  });

  function findLine({verse, word}) {
  }

  marks.forEach(mark => {
    var startPos = pos[mark.start.verse][mark.start.word];
    var endPos = pos[mark.end.verse][mark.end.word];
    ctx.fillStyle = mark.style.color;
    ctx.globalAlpha = 0.4;
    if (startPos.line === endPos.line) {
      ctx.fillRect(
        startPos.left,
        startPos.top - font.size,
        endPos.left - startPos.left + endPos.width,
        font.size);
      return;
    }

    // word to end
    ctx.fillRect(
      startPos.left, startPos.top - font.size,
      lines[startPos.line][4] - startPos.left,
      font.size
    );

    for (var l = startPos.line + 1; l < endPos.line; l++) {
      ctx.fillRect(
        lines[l][3],
        lines[l][2] - font.size,
        lines[l][4] - lines[l][3],
        font.size
      );
    }

    ctx.fillRect(
      lines[endPos.line][3], endPos.top - font.size,
      endPos.left + endPos.width - lines[endPos.line][3],
      font.size
    );
  });
}

var widthCache = {};
function measure(text, ctx) {
  if (!widthCache[text]) {
    widthCache[text] = ctx.measureText(text);
  }
  return widthCache[text];
}
