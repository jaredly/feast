
import sideline from './sideline';
import highlight from './highlight';

export default function drawMarks(ctx, lines, pos, sideCoords, marks, font, size, editing) {
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

