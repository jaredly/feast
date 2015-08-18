
var evts = {
  move: 'mousemove',
  down: 'mousedown',
  up: 'mouseup',
  click: 'click',
};

export default class Remarkup {
  constructor(canv, verses, options) {
    this.options = options;
    this.canv = canv;
    this.ctx = canv.getContext('2d');
    this.predraw(verses);
    this._listeners = {};
    this._handlers = {};
  }

  predraw(verses) {
    this.ctx.clearRect(0, 0, this.canv.width, this.canv.height);
    this.ctx.fillStyle = 'black';
    this.ctx.globalAlpha = 1;
    this.ctx.font = this.options.font.size + 'px ' + this.options.font.family;

    var {lines, pos} = drawText(this.ctx, this.options.font, this.options.size, verses);
    this.lines = lines;
    this.pos = pos;
    this.renderedText = this.ctx.getImageData(0, 0, this.canv.width, this.canv.height);
  }

  draw(marks) {
    this.ctx.clearRect(0, 0, this.canv.width, this.canv.height);
    this.ctx.putImageData(this.renderedText, 0, 0);

    drawMarks(this.ctx, this.lines, this.pos, marks, this.options.font);
  }

  // mark up all the places that don't have an associated target
  drawDebug() {
    this.ctx.clearRect(0, 0, this.canv.width, this.canv.height);
    this.ctx.putImageData(this.renderedText, 0, 0);

    this.ctx.fillStyle = 'red';
    var w = 1;
    for (var x=0; x<this.canv.width; x += w) {
      for (var y=0; y<this.canv.height; y += w) {
        var target = getWordForPos(x, y, this.options.size, this.options.font, this.lines, this.pos);
        if (!target) {
          this.ctx.fillRect(x, y, w, w);
        }
      }
    }
  }

  on(evt, fn) {
    if (!this._listeners[evt]) {
      this._listeners[evt] = [fn];
      this._attach(evt);
    } else {
      this._listeners[evt].push(fn);
    }
    return () => this.off(evt, fn);
  }

  off(evt, fn) {
    var ix = this._listeners[evt].indexOf(fn);
    if (ix === -1) return;
    this._listeners[evt].splice(ix, 1);
    if (!this._listeners[evt].length) {
      var target = (evt === 'click' || evt === 'down') ? this.canv : window;
      target.removeEventListener(evts[evt], this._handlers[evt]);
      this._listeners[evt] = null;
      this._handlers[evt] = null;
    }
  }

  _attach(evt) {
    this._handlers[evt] = e => {
      var target = getMousePos(this.canv, e, this.options.size, this.options.font, this.lines, this.pos);
      this._listeners[evt].forEach(fn => fn(target, e));
    };
    var target = (evt === 'click' || evt === 'down') ? this.canv : window;
    target.addEventListener(evts[evt], this._handlers[evt]);
  }
}

function getWordForPos(x, y, size, font, lines, pos) {
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
    if (x < line.left) {
      return {verse: line.verse, word: line.word};
    }
    if (x > line.right) {
      if (lines[i + 1] && lines[i + 1].verse === line.verse) {
        return {verse: line.verse, word: lines[i + 1].word - 1};
      }
      return {verse: line.verse, word: pos[line.verse].length - 1};
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

function getMousePos(canv, e, size, font, lines, pos) {
  var rect = canv.getBoundingClientRect();
  var x = e.clientX - rect.left;
  var y = e.clientY - rect.top;
  return getWordForPos(x, y, size, font, lines, pos);
}

/*
export default function remarkup(canv, size, verses, marks, font, handlers) {
  var ctx = canv.getContext('2d');
  ctx.clearRect(0, 0, canv.width, canv.height);
  ctx.fillStyle = 'black';
  ctx.globalAlpha = 1;
  ctx.font = font.size + 'px ' + font.family;

  var {lines, pos} = drawText(ctx, font, size, verses);

  drawMarks(ctx, lines, pos, marks, font);

  window.lines = lines;
  window.poss = pos;
}
*/

function drawText(ctx, font, size, verses) {
  var lines = [];
  var pos = [];
  var {width, height} = size;

  var top = font.size + size.margin;
  var left = size.margin + font.indent;
  var lineHeight = font.lineHeight;

  verses.forEach((verse, i) => {
    var wordPos = [];
    pos.push(wordPos);
    var words = verse.words;
    lines.push({
      verse: i,
      word: 0,
      top,
      left,
      right: 0,
    });
    words.forEach((word, w) => {
      var ww = measure(word, ctx).width;
      if (left + font.space + ww > width - size.margin) {
        lines[lines.length - 1].right = left - font.space;
        top += lineHeight;
        left = size.margin;
        lines.push({
          verse: i,
          word: w,
          top,
          left,
          right: 0,
        });
      }
      wordPos.push({left, top, width: ww, line: lines.length - 1});
      ctx.fillText(word, left, top);
      left += ww + font.space;
    });

    lines[lines.length - 1].right = left - font.space;
    top += lineHeight * 2;
    left = size.margin + font.indent;
  });
  return {lines, pos};
}

function drawMarks(ctx, lines, pos, marks, font) {
  var wordMarginV = font.space;
  var wordMarginH = font.space;

  marks.forEach(mark => {
    var startPos = pos[mark.start.verse][mark.start.word];
    var endPos = pos[mark.end.verse][mark.end.word];
    ctx.fillStyle = mark.style.color;
    ctx.globalAlpha = 0.4;
    if (startPos.line === endPos.line) {
      roundRect(ctx,
        startPos.left - wordMarginH,
        startPos.top - font.size,
        endPos.left - startPos.left + endPos.width + wordMarginH * 2,
        font.size + wordMarginV
      );
      return;
    }

    // word to end
    roundRect(ctx,
      startPos.left - wordMarginH,
      startPos.top - font.size,
      lines[startPos.line].right - startPos.left + wordMarginH * 2,
      font.size + wordMarginV
    );

    for (var l = startPos.line + 1; l < endPos.line; l++) {
      roundRect(ctx,
        lines[l].left - wordMarginH,
        lines[l].top - font.size,
        lines[l].right - lines[l].left + wordMarginH * 2,
        font.size + wordMarginV
      );
    }

    roundRect(ctx,
      lines[endPos.line].left - wordMarginH,
      endPos.top - font.size,
      endPos.left + endPos.width - lines[endPos.line].left + wordMarginH * 2,
      font.size + wordMarginV
    );
  });
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  stroke = false;
  fill = true;
  if (typeof stroke == "undefined" ) {
    stroke = true;
  }
  if (typeof radius === "undefined") {
    radius = 5;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (stroke) {
    ctx.stroke();
  }
  if (fill) {
    ctx.fill();
  }        
}

var widthCache = {};
function measure(text, ctx) {
  if (!widthCache[text]) {
    widthCache[text] = ctx.measureText(text);
  }
  return widthCache[text];
}
