/**
 * @flow
 */

import type {SizeConfig, FontConfig, Lines, Pos} from './types';

export function getWordForPos(x: number, y: number, size: SizeConfig, font: FontConfig, lines: Lines, pos: Pos) {
  var margin = 0; // size.margin;
  if (x < margin || y < margin || x > size.width - margin || y > size.height - margin) {
    return; // out of bounds
  }
  for (var i=0; i<lines.length; i++) {
    var line = lines[i];
    if (y > line.top + font.space) continue;
    if (y < line.top - font.size) {
      // console.log('not on a line');
      return;
    }
    if (x < line.left || x > line.right) {
      return {
        verse: line.verse,
        word: false,
        side: x < line.left ? 'left' : 'right',
        left: line.word,
        right: (lines[i + 1] && lines[i + 1].verse === line.verse) ?
          lines[i + 1].word - 1 :
          pos[line.verse].length - 1,
      };
    }
    var nextLine = lines[i + 1];
    var lastWord =
      (nextLine && nextLine.verse === line.verse) ?
        nextLine.word :
        pos[line.verse].length;
    for (var word = line.word; word < lastWord; word++) {
      if (pos[line.verse][word].left + pos[line.verse][word].width + font.space < x) {
        continue;
      }
      return {verse: line.verse, word};
    }
    return;
  }
}

