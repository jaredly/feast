/**
 * @flow
 */

import type {Context, Verses, Pos} from './types';

export default function drawText(ctx: Context, verses: Verses, pos: Pos) {
  verses.forEach((verse, i) => {
    verse.words.forEach((word, w) => {
      var {left, top} = pos[i][w];
      ctx.fillText(word, left, top);
    });
  });
}

