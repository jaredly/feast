
import calcSideLeft from './calcSideLeft';

export default function sideline(ctx, mark, lines, pos, font, size, sideLevels) {
  ctx.globalAlpha = 1;
  var wordMarginV = font.space;
  var wordMarginH = font.space;
  var top = pos[mark.start.verse][mark.start.word].top - font.size + wordMarginV;
  var bottom = pos[mark.end.verse][mark.end.word].top;
  var left = calcSideLeft(sideLevels, top, bottom) + 2;
  ctx.beginPath();
  ctx.strokeStyle = mark.style.color;
  ctx.lineWidth = 2;
  var leftPos = parseInt(size.hmargin - font.space * left);
  ctx.moveTo(leftPos, top);
  ctx.lineTo(leftPos, bottom);
  ctx.stroke();
}

