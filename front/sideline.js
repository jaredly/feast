
export default function sideline(ctx, mark, coords) {
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.strokeStyle = mark.style.color;
  ctx.lineWidth = 2;
  var {left, top, bottom} = coords;
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.stroke();
}

