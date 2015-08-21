/**
 * @flow
 */

import type {Context, Mark} from './types';

export default function sideline(ctx: Context, mark: Mark, coords: {top: number, left: number, bottom: number}) {
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.strokeStyle = mark.style.color;
  ctx.lineWidth = 2;
  var {left, top, bottom} = coords;
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.stroke();
}

