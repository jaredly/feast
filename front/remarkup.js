
export default function remarkup(size, ctx, verses, marks, font) {
  ctx.font = font.size + 'px ' + font.family;
  var {width, height} = size;

  var top = font.size + size.margin;;
  var left = size.margin + font.indent;
  var lineHeight = font.lineHeight;

  var lines = [];
  var pos = [];

  var wordMarginV = font.space;
  var wordMarginH = font.space;

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
        lines[lines.length - 1].push(left - font.space);
        top += lineHeight;
        left = size.margin;
        lines.push([i, w, top, left]);
      }
      wordPos.push({left, top, width: ww, line: lines.length - 1});
      ctx.fillText(word, left, top);
      left += ww + font.space;
    });

    lines[lines.length - 1].push(left - font.space);
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
      roundRect(ctx,
        startPos.left - wordMarginH,
        startPos.top - font.size,
        endPos.left - startPos.left + endPos.width + wordMarginH * 2,
        font.size + wordMarginV
      );
      return;
    }

    // word to end
    roundRect(ctx,
      startPos.left - wordMarginH,
      startPos.top - font.size,
      lines[startPos.line][4] - startPos.left + wordMarginH * 2,
      font.size + wordMarginV
    );

    for (var l = startPos.line + 1; l < endPos.line; l++) {
      roundRect(ctx,
        lines[l][3] - wordMarginH,
        lines[l][2] - font.size,
        lines[l][4] - lines[l][3] + wordMarginH * 2,
        font.size + wordMarginV
      );
    }

    roundRect(ctx,
      lines[endPos.line][3] - wordMarginH,
      endPos.top - font.size,
      endPos.left + endPos.width - lines[endPos.line][3] + wordMarginH * 2,
      font.size + wordMarginV
    );
  });
  window.lines = lines;
  window.poss = pos;
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  stroke = false;
  fill = true;
  if (typeof stroke == "undefined" ) {
    stroke = true;
  }
  if (typeof radius === "undefined") {
    radius = 5;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (stroke) {
    ctx.stroke();
  }
  if (fill) {
    ctx.fill();
  }        
}

var widthCache = {};
function measure(text, ctx) {
  if (!widthCache[text]) {
    widthCache[text] = ctx.measureText(text);
  }
  return widthCache[text];
}
