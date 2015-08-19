
import sideline from './sideline';
import highlight from './highlight';

export default function drawMarks(ctx, lines, pos, marks, font, size) {
  var sideLevels = [[]];
  marks.forEach(mark => {
    if (mark.type === 'sideline') {
      sideline(ctx, mark, lines, pos, font, size, sideLevels);
      if (mark.highlighted) {
        highlight(ctx, mark, lines, pos, font);
      }
    } else {
      highlight(ctx, mark, lines, pos, font);
    }
  });
}

