
export default function parseContent(text) {
  var node = document.createElement('div');
  node.innerHTML = text;
  node = node.firstChild;
  ;[].map.call(node.querySelectorAll('sup'), s => s.parentNode.removeChild(s));
  ;[].map.call(node.querySelectorAll('.verseNumber'), s => s.parentNode.removeChild(s));
  var verses = [].map.call(node.querySelectorAll('p.verse'), p => ({
    words: p.textContent.split(/\s+/g),
    uri: p.getAttribute('uri'),
    num: p.getAttribute('id'),
  }));
  var intro = node.querySelector('p.studySummery');
  if (intro) {
    intro = intro.textContent;
  }
  return {
    intro,
    verses,
  };
}

