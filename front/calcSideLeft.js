
export default function calcSideLeft(levels, top, bottom) {
  var target = null;
  var found = levels.some((level, i) => {
    var full = level.some(([itop, ibottom]) => {
      if ((itop <= top && top < ibottom) ||
          (top <= itop && itop < bottom)) {
        return true;
      }
    });
    if (full) return false;
    level.push([top, bottom]);
    target = i;
    return true;
  });
  if (!found) {
    levels.push([[top, bottom]]);
    return levels.length - 1;
  }
  return target;
}

