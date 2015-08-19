
export default function highlight(ctx, mark, lines, pos, font) {
  var wordMarginV = font.space;
  var wordMarginH = font.space;

  var startPos = pos[mark.start.verse][mark.start.word];
  var endPos = pos[mark.end.verse][mark.end.word];
  ctx.fillStyle = mark.style.color;
  ctx.strokeStyle = mark.style.color;
  ctx.lineWidth = 2;
  if (mark.style.underline) {
    ctx.globalAlpha = 1;
  } else {
    if (mark.highlighted) {
      if (mark.type === 'sideline') {
        ctx.globalAlpha = 0.1;
      } else {
        ctx.globalAlpha = 0.8;
      }
    } else {
      ctx.globalAlpha = 0.4;
    }
  }
  if (startPos.line === endPos.line) {
    if (mark.style.underline) {
      line(ctx, startPos.top + wordMarginV, startPos.left, endPos.left + endPos.width);
    } else {
      roundRect(ctx,
        startPos.left - wordMarginH,
        startPos.top - font.size,
        endPos.left - startPos.left + endPos.width + wordMarginH * 2,
        font.size + wordMarginV
      );
    }
    return;
  }

  // word to end
  if (mark.style.underline) {
    line(ctx, startPos.top + wordMarginV, startPos.left, lines[startPos.line].right);
  } else {
    roundRect(ctx,
      startPos.left - wordMarginH,
      startPos.top - font.size,
      lines[startPos.line].right - startPos.left + wordMarginH * 2,
      font.size + wordMarginV
    );
  }

  for (var l = startPos.line + 1; l < endPos.line; l++) {
    if (mark.style.underline) {
      line(ctx, lines[l].top + wordMarginV, lines[l].left, lines[l].right);
    } else {
      roundRect(ctx,
        lines[l].left - wordMarginH,
        lines[l].top - font.size,
        lines[l].right - lines[l].left + wordMarginH * 2,
        font.size + wordMarginV
      );
    }
  }

  if (mark.style.underline) {
    line(ctx, lines[endPos.line].top + wordMarginV, lines[endPos.line].left, endPos.left + endPos.width);
  } else {
    roundRect(ctx,
      lines[endPos.line].left - wordMarginH,
      endPos.top - font.size,
      endPos.left + endPos.width - lines[endPos.line].left + wordMarginH * 2,
      font.size + wordMarginV
    );
  }
}

function line(ctx, top, left, right) {
  ctx.beginPath();
  top = parseInt(top);
  ctx.moveTo(left, top);
  ctx.lineTo(right, top);
  ctx.stroke();
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  stroke = false;
  fill = true;
  x = parseInt(x);
  y = parseInt(y);
  width = parseInt(width);
  height = parseInt(height);
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

