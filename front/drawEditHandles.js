
import roundRect from './roundRect';

export default function drawEditHandles(ctx, mark, lines, pos, font) {
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = mark.style.color;
  ctx.strokeStyle = mark.style.color;
  ctx.lineWidth = 2;

  var startPos = pos[mark.start.verse][mark.start.word];
  var endPos = pos[mark.end.verse][mark.end.word];

  var {start, end} = editHandleBoxes(startPos, endPos, font);

  roundRect(ctx,
            start.x,
            start.y,
            start.width,
            start.height,
            5);

  roundRect(ctx,
            end.x,
            end.y,
            end.width,
            end.height,
            5);
}

export function editHandleBoxes(startPos, endPos, font) {
  var wordMarginV = font.space;
  var wordMarginH = font.space;
  var width = font.space * 2;
  return {
    start: {
      x: startPos.left - wordMarginH,
      y: startPos.top - font.size,
      width: startPos.width + wordMarginH * 2,
      height: font.size + wordMarginV,
    },
    end: {
      x: endPos.left - wordMarginH,
      y: endPos.top - font.size,
      width: endPos.width + wordMarginH * 2,
      height: font.size + wordMarginV,
    }
  }
}
