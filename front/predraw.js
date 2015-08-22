
import drawText from './drawText';
import type {Verses, SizeConfig, FontConfig, Lines, Pos} from './types';

export default function predraw(verses: Verses, size: SizeConfig, font: FontConfig): {lines: Lines, pos: Pos, img: Object} {
  // $FlowFixMe why no createElement?
  var img = document.createElement('img');
  var canv = document.createElement('canvas');
  canv.height = size.height;
  canv.width = size.width;
  var ctx = canv.getContext('2d');
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = 'black';
  ctx.globalAlpha = 1;
  ctx.font = font.size + 'px ' + font.family;
  var {lines, pos} = drawText(ctx, font, size, verses);
  img.src = canv.toDataURL();
  return {lines, pos, img};
}

