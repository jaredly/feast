
import type {Context, Lines, Pos, SideCoords, Marks, FontConfig, SizeConfig, MarkID} from './types';

export default function drawNotes(ctx, notes: any, marks: any, pos: Pos, sideCoords, size: SizeConfig, font: FontConfig) {
  var ids = {};
  var markIds = [];
  for (var mid in marks) {markIds.push(mid)};
  markIds.sort((a, b) =>
               marks[b].verse === marks[a].verse ?
                 marks[b].word - marks[a].word :
                 marks[b].verse - marks[a].verse);
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

  var left = size.width - size.hmargin + font.space;
  var farLeft = size.hmargin / 2 - font.space * 5;
  var right = size.hmargin - font.space;

  markIds.forEach(mid => {
    var nids = ids[mid];
    if (!nids) return;
    var mark = marks[mid];
    var isLeft = mark.type === 'sideline';
    var top;

    if (isLeft) {
      top = lpos;
    } else {
      top = rpos;
    }

    var wordTop = Math.floor(pos[mark.start.verse][mark.start.word].top - font.size / 2);
    if (wordTop > top) {
      top = wordTop;
    }
    top = Math.floor(top);

    ctx.strokeStyle = mark.style.color;
    ctx.beginPath();
    if (isLeft) {
      ctx.moveTo(sideCoords[mid].left, sideCoords[mid].top);
      ctx.lineTo(right - font.space * 5, top);
    } else {
      ctx.moveTo(left, wordTop);
      ctx.lineTo(left + font.space * 3, top);
    }
    ctx.stroke();

    nids.forEach(nid => {
      if (isLeft) {
        top = drawTextChunk(ctx, farLeft, top, size.hmargin / 2, notes[nid].text) + font.lineHeight * .7;
      } else {
        top = drawTextChunk(ctx, left + font.space * 4, top, size.hmargin / 2, notes[nid].text) + font.lineHeight * .7;
      }
    });

    if (isLeft) {
      lpos = top;
    } else {
      rpos = top;
    }
    console.log('pos', lpos, rpos);
  });
}

function drawTextChunk(ctx, left, top, width, text) {
  var fontSize = 15;
  var font = {
    family: 'serif',
    space: fontSize / 3,
    lineHeight: fontSize * 1.1,
    size: fontSize,
    indent: fontSize,
  };
  ctx.font = font.size + 'px ' + font.family;
  ctx.fillStyle = 'black';

  var words = text.split(/ /g);
  if (words.length > 10) {
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

