/**
 * @flow
 */

import sideline from './sideline';
import highlight from './highlight';

import type {Context, Lines, Pos, SideCoords, Marks, FontConfig, SizeConfig, MarkID} from './types';

export default function drawMarks(ctx: Context, lines: Lines, pos: Pos, sideCoords: SideCoords, marks: Marks, font: FontConfig, size: SizeConfig, editing: ?MarkID) {
  for (var id in marks) {
    var mark = marks[id];
    if (mark.type === 'sideline') {
      sideline(ctx, mark, sideCoords[mark.id]);
      if (mark.id === editing) {
        highlight(ctx, mark, lines, pos, font);
      }
    } else {
      highlight(ctx, mark, lines, pos, font);
    }
  }
}

