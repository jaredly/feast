
export default function drawOver(ctx, mark, verses, lines, pos, font) {
  var positions = wordCoords(mark.start, mark.end, verses);

  ctx.font = font.size + 'px ' + font.family;
  ctx.globalAlpha = 1;

  if (mark.type === 'outline') {
    ctx.lineWidth = 4;
    ctx.strokeStyle = mark.style.color;
    ctx.fillStyle = 'white';
    // ctx.globalAlpha = 0.6;
    positions.forEach(([v, w]) => {
      ctx.strokeText(verses[v].words[w], pos[v][w].left, pos[v][w].top);
      ctx.fillText(verses[v].words[w], pos[v][w].left, pos[v][w].top);
    });
  } else {
    ctx.fillStyle = mark.style.color;
    positions.forEach(([v, w]) => {
      ctx.fillText(verses[v].words[w], pos[v][w].left, pos[v][w].top);
    });
  }
}

function wordCoords(start, end, verses) {
  var positions = [];

  if (start.verse === end.verse) {
    for (var w = start.word; w <= end.word; w++) {
      positions.push([start.verse, w]);
    }
  } else {
    for (var w = start.word; w < verses[start.verse].words.length; w++) {
      positions.push([start.verse, w]);
    }
    for (var v = start.verse + 1; v < end.verse; v++) {
      for (var w = 0; w < verses[v].words.length; w++) {
        positions.push([v, w]);
      }
    }
    for (var w = 0; w <= end.word; w++) {
      positions.push([end.verse, w]);
    }
  }

  return positions;
}
