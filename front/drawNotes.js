
import type {Context, Lines, Pos, SideCoords, Marks, Tags, FontConfig, SizeConfig, MarkID} from './types';

export default function drawNotes(ctx, notes: any, marks: Marks, tags: Tags, pos: Pos, sideCoords, size: SizeConfig, editing: ?MarkID) {
  var noteBoxes = {};
  var ids = {};
  var markIds = [];
  for (var mid in marks) {markIds.push(mid)};
  markIds.sort((a, b) =>
               marks[a].start.verse === marks[b].start.verse ?
                 marks[a].start.word - marks[b].start.word :
                 marks[a].start.verse - marks[b].start.verse);
  for (var nid in notes) {
    if (!ids[notes[nid].mark]) {
      ids[notes[nid].mark] = [nid];
    } else {
      ids[notes[nid].mark].push(nid);
    }
  }

  var lpos = size.vmargin;
  var rpos = size.vmargin;

  ctx.globalAlpha = 1;
  ctx.lineWidth = 2;

  var fontSize = 15;
  var font = {
    family: 'serif',
    space: fontSize / 3,
    lineHeight: fontSize * 1.1,
    size: fontSize,
    indent: fontSize,
  };

  ctx.font = font.size + 'px ' + font.family;

  var left = size.width - size.hmargin + font.space;
  var farLeft = size.hmargin / 2 - font.space * 15;
  var right = size.hmargin - font.space;

  markIds.forEach(mid => {
    var nids = ids[mid] || [];;
    var mark = marks[mid];
    var tids = mark.tags;
    if (!nids.length && !tids.length) return;
    var isLeft = mark.type === 'sideline';
    var top;

    ctx.strokeStyle = mark.style.color;
    ctx.beginPath();

    if (isLeft) {
      var wordTop = Math.floor(pos[mark.start.verse][mark.start.word].top - font.size + font.space);
      top = lpos;
      if (wordTop > top) {
        top = wordTop;
      }
      var wordBottom = Math.floor(pos[mark.end.verse][mark.end.word].top);
      if (top < wordBottom ) {
        wordBottom = top;
      }
      top = Math.floor(top);
      ctx.moveTo(sideCoords[mid].left, wordBottom);
      ctx.lineTo(right - font.space * 14, top);
      ctx.lineTo(right - font.space * 14, top - font.size / 2);
      ctx.lineTo(right - font.space * 14, top + font.size / 2);
    } else {
      var wordTop = Math.floor(pos[mark.start.verse][mark.start.word].top - font.size / 2);
      top = Math.floor(rpos);
      if (wordTop > top) {
        top = wordTop;
      }
      var wordBottom = Math.floor(pos[mark.end.verse][mark.end.word].top);
      if (top < wordBottom ) {
        wordBottom = top;
      }
      ctx.moveTo(left, wordBottom);
      ctx.lineTo(left + font.space * 3, top);
      ctx.lineTo(left + font.space * 3, top - font.size / 2);
      ctx.lineTo(left + font.space * 3, top + font.size / 2);
    }

    ctx.stroke();

    var box = {
      top: top - font.size,
      left: isLeft ? farLeft - font.space : left + font.space * 3,
      bottom: 0,
      right: 0,
    };

    tids.forEach(tid => {
      if (!tags[tid]) {
        console.log('no tags', tags, tid);
        return;
      }
      var x = isLeft ? farLeft : left + font.space * 4;
      var width = ctx.measureText(tags[tid].name).width;
      ctx.fillStyle = tags[tid].color || '#ccc';
      ctx.globalAlpha = 0.5;
      drawTag(ctx, x, top - font.size + font.space, width + font.space * 2, font.size + font.space);
      // ctx.fillRect();
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'black';
      ctx.fillText(tags[tid].name, x + font.space, top + font.space);
      top += font.lineHeight * 1.5;
    });
    if (tids.length && !nids.length) {
      top += font.lineHeight * 0.5;
    }

    nids.forEach(nid => {
      if (isLeft) {
        top = drawTextChunk(ctx, farLeft, top, size.hmargin / 2, notes[nid].text, font) + font.lineHeight * 1.5;
      } else {
        top = drawTextChunk(ctx, left + font.space * 4, top, size.hmargin / 2, notes[nid].text, font) + font.lineHeight * 1.5;
      }
    });

    box.bottom = top - font.lineHeight * 1.5 + font.space * 1.5;
    box.right = box.left + size.hmargin / 2 + font.space;
    noteBoxes[mid] = box;

    if (editing === mid) {
      ctx.strokeRect(box.left, box.top, box.right - box.left, box.bottom - box.top);
    }

    top += font.lineHeight * .3;
    if (isLeft) {
      lpos = top;
    } else {
      rpos = top;
    }
  });

  return noteBoxes;
}

function drawTag(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w + h / 2, y + h / 2);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.fill();
}

function drawTextChunk(ctx, left, top, width, text, font) {
  ctx.fillStyle = 'black';

  var lines = text.split('\n')
  var words = lines[0].split(/ /g);
  if (lines.length > 1 || words.length > 10) {
    words = words.slice(0, 10).concat(['...']);
  }

  var x = left;
  words.forEach((word, w) => {
    var ww = measure(word, ctx).width;
    if (x + font.space + ww > left + width) {
      top += font.lineHeight;
      x = left;
    }
    ctx.fillText(word, x, top);
    x += ww + font.space;
  });

  return top;
}

var widthCache = {};
function measure(text, ctx) {
  if (!widthCache[text]) {
    widthCache[text] = ctx.measureText(text);
  }
  return widthCache[text];
}

