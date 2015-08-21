
import roundRect from './roundRect';

export default function drawEditHandles(ctx, mark, lines, pos, font) {
  var wordMarginV = font.space;
  var wordMarginH = font.space;
  ctx.globalAlpha = 1;

  var width = font.size;

  var startPos = pos[mark.start.verse][mark.start.word];
  var endPos = pos[mark.end.verse][mark.end.word];
  ctx.fillStyle = mark.style.color;
  ctx.strokeStyle = mark.style.color;
  ctx.lineWidth = 2;

  roundRect(ctx,
    startPos.left - width/2,
    startPos.top - font.size,
    width,
    font.size + wordMarginV,
    5
  );

  roundRect(ctx,
    endPos.left + endPos.width - width/2,
    endPos.top - font.size,
    width,
    font.size + wordMarginV,
    5
  );
}
