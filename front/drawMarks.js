
import sideline from './sideline';
import highlight from './highlight';

export default function drawMarks(ctx, lines, pos, sideCoords, marks, font, size, editing) {
  marks.forEach(mark => {
    if (mark.type === 'sideline') {
      sideline(ctx, mark, sideCoords[mark.id]);
      if (mark.highlighted) {
        highlight(ctx, mark, lines, pos, font);
      }
    } else {
      highlight(ctx, mark, lines, pos, font);
    }
  });
}

