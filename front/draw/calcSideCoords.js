/**
 * @flow
 */

import calcSideLeft from './calcSideLeft';
import type {FontConfig, SizeConfig, Pos, Marks, SideCoords} from './types';

export default function calcSideCoords(marks: Marks, pos: Pos, font: FontConfig, size: SizeConfig): SideCoords {
  var sideCoords = {};
  var levels = [];
  for (var id in marks) {
    var mark = marks[id];
    if (mark.type !== 'sideline') {
      continue;
    }
    var wordMarginV = font.space;
    var wordMarginH = font.space;
    var top = pos[mark.start.verse][mark.start.word].top - font.size + wordMarginV;
    var bottom = pos[mark.end.verse][mark.end.word].top;
    var level = calcSideLeft(levels, top, bottom) + 2;
    var left = Math.floor(size.hmargin - font.space * level);
    sideCoords[mark.id] = {top, bottom, left};
  }
  return sideCoords;
}
