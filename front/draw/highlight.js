/**
 * @ flow
 */

import roundRect from './roundRect';

import type {Context, Mark, Lines, Pos, FontConfig} from './types';

export default function highlight(ctx: Context, mark: Mark, lines: Lines, pos: Pos, font: FontConfig) {
  var wordMarginV = font.space;
  var wordMarginH = font.space;

  var startPos = pos[mark.start.verse][mark.start.word];
  var endPos = pos[mark.end.verse][mark.end.word];
  ctx.fillStyle = mark.style.color;
  ctx.strokeStyle = mark.style.color;
  ctx.lineWidth = 2;
  if (mark.type === 'underline') {
    ctx.globalAlpha = 1;
  } else {
    if (mark.type === 'sideline') {
      ctx.globalAlpha = 0.1;
    } else {
      ctx.globalAlpha = 0.4;
    }
  }
  if (startPos.line === endPos.line) {
    if (mark.type === 'underline') {
      line(ctx, startPos.top + wordMarginV - 1, startPos.left, endPos.left + endPos.width);
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
  if (mark.type === 'underline') {
    line(ctx, startPos.top + wordMarginV - 1, startPos.left, lines[startPos.line].right);
  } else {
    roundRect(ctx,
      startPos.left - wordMarginH,
      startPos.top - font.size,
      lines[startPos.line].right - startPos.left + wordMarginH * 2,
      font.size + wordMarginV
    );
  }

  for (var l = startPos.line + 1; l < endPos.line; l++) {
    if (mark.type === 'underline') {
      line(ctx, lines[l].top + wordMarginV - 1, lines[l].left, lines[l].right);
    } else {
      roundRect(ctx,
        lines[l].left - wordMarginH,
        lines[l].top - font.size,
        lines[l].right - lines[l].left + wordMarginH * 2,
        font.size + wordMarginV
      );
    }
  }

  if (mark.type === 'underline') {
    line(ctx, lines[endPos.line].top + wordMarginV - 1, lines[endPos.line].left, endPos.left + endPos.width);
  } else {
    roundRect(ctx,
      lines[endPos.line].left - wordMarginH,
      endPos.top - font.size,
      endPos.left + endPos.width - lines[endPos.line].left + wordMarginH * 2,
      font.size + wordMarginV
    );
  }
}

function line(ctx: Context, top: number, left: number, right: number) {
  ctx.beginPath();
  top = Math.floor(top);
  ctx.moveTo(left, top);
  ctx.lineTo(right, top);
  ctx.stroke();
}
