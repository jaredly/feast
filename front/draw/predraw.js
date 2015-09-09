
import measureText from './measureText';
import drawText from './drawText';
import type {Verses, SizeConfig, FontConfig, Lines, Pos} from './types';

export default function predraw(verses: Verses, size: SizeConfig, font: FontConfig): {lines: Lines, pos: Pos, img: Object} {
  // $FlowFixMe why no createElement?
  var img = document.createElement('img');
  var canv = document.createElement('canvas');

  var ctx = canv.getContext('2d');
  ctx.font = font.size + 'px ' + font.family;

  var {lines, pos, height} = measureText(ctx, font, size, verses);

  canv.height = height;
  canv.width = size.width;

  ctx.font = font.size + 'px ' + font.family;
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = 'black';
  ctx.globalAlpha = 1;

  drawText(ctx, verses, pos);

  img.src = canv.toDataURL();
  return {lines, pos, img, height};
}

