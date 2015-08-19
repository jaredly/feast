
import drawText from './drawText';
import drawMarks from './drawMarks';
import getMousePos, {getWordForPos} from './getMousePos';

var evts = {
  move: 'mousemove',
  down: 'mousedown',
  up: 'mouseup',
  click: 'click',
  'mark:hover': 'mousemove',
  'mark:click': 'click',
};

export default class Remarkup {
  constructor(canv, verses, marks, options) {
    this.options = options;
    this.canv = canv;
    this.img = document.createElement('img');
    this.ctx = canv.getContext('2d');
    this.predraw(verses);
    this._listeners = {};
    this._handlers = {};
    this.marks = marks;

    this.draw();

    this.on('hovermark', mark => {
      if (mark) {
        this.canv.style.cursor = 'pointer';
      } else {
        this.canv.style.cursor = 'default';
      }
    });
  }

  setMarks(marks) {
    this.marks = marks;
    this.draw();
  }

  predraw(verses) {
    this.ctx.clearRect(0, 0, this.canv.width, this.canv.height);
    this.ctx.fillStyle = 'black';
    this.ctx.globalAlpha = 1;
    this.ctx.font = this.options.font.size + 'px ' + this.options.font.family;

    var {lines, pos} = drawText(this.ctx, this.options.font, this.options.size, verses);
    this.lines = lines;
    this.pos = pos;
    this.img.src = this.canv.toDataURL();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canv.width, this.canv.height);

    drawMarks(this.ctx, this.lines, this.pos, this.marks, this.options.font, this.options.size);
    this.ctx.globalAlpha = 1;
    this.ctx.drawImage(this.img, 0, 0);
  }

  // mark up all the places that don't have an associated target
  drawDebug() {
    this.ctx.clearRect(0, 0, this.canv.width, this.canv.height);

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
    this.ctx.globalAlpha = 1;
    this.ctx.drawImage(this.img, 0, 0);
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
    if (evt.match(/^mark:/)) {
      this._handlers[evt] = e => {
        var target = getMousePos(this.canv, e, this.options.size, this.options.font, this.lines, this.pos);
        this._listeners[evt].forEach(fn => fn(target, e));
      };
    } else {
      this._handlers[evt] = e => {
        var target = getMousePos(this.canv, e, this.options.size, this.options.font, this.lines, this.pos);
        this._listeners[evt].forEach(fn => fn(target, e));
      };
    }
    var target = (evt === 'click' || evt === 'down') ? this.canv : window;
    target.addEventListener(evts[evt], this._handlers[evt]);
  }
}
