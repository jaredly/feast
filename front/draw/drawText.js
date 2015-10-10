/**
 * @ flow
 */

import type {Context, Verses, Pos} from './types';

export default function drawText(ctx: Context, verses: Verses, pos: Pos) {
  verses.forEach((verse, i) => {
    var {top} = pos[i][0];
    ctx.fillStyle = '#555';
    ctx.fillText(verse.num, pos[i].numberLeft, top);
    ctx.fillStyle = '#222';
    verse.words.forEach((word, w) => {
      var {left, top} = pos[i][w];
      ctx.fillText(word, left, top);
    });
  });
}

