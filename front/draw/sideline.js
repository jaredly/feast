/**
 * @ flow
 */

import type {Context, Mark, FontConfig} from './types';

export default function sideline(ctx: Context, mark: Mark, font: FontConfig, coords: {top: number, left: number, bottom: number}, editing: bool) {

  var {left, top, bottom} = coords;
  ctx.globalAlpha = 1;

  if (editing) {
    ctx.beginPath();
    ctx.strokeStyle = mark.style.color
    ctx.lineWidth = font.space / 2;
    ctx.moveTo(left, top);
    ctx.lineTo(left, bottom);
    ctx.stroke();
  } else {


    ctx.beginPath();
    ctx.strokeStyle = mark.style.color;
    ctx.lineWidth = 2;
    ctx.moveTo(left, top);
    ctx.lineTo(left, bottom);
    ctx.stroke();
  }
}

