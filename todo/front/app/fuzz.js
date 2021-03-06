
import * as creators from '../util/creators';
const uuid = () => Math.random().toString(16).slice(2);

module.exports = tab => {
  const words = ['one', 'dog', 'ran', 'away', 'out', 'into', 'from', 'boston'];

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const randText = num => {
    const got = [];
    for (let i=0; i<num; i++) {
      got.push(pick(words));
    }
    return got.join(' ') + '.';
  };

  const rcol = () => Math.floor(Math.random() * 255);

  const things = [
    () => {
      const id = uuid();
      const text = id + ': ' + randText(10);
      const color = `rgb(${rcol()}, ${rcol()}, ${rcol()})`;
      return creators.add(id, text, color);
    },
    () => {
      const id = pick(Object.keys(tab.state.local.items));
      if (!id) return;
      return creators.update(id, {
        completed: !tab.state.local.items[id].completed
      });
    },
    () => {
      const id = pick(Object.keys(tab.state.local.items));
      if (!id) return;
      return creators.remove(id);
    },
    () => {
      const id = pick(Object.keys(tab.state.local.items));
      if (!id) return;
      return creators.update(id, {
        text: tab.state.local.items[id].text + randText(3),
      });
    },
    () => {
      const id = pick(Object.keys(tab.state.local.items));
      if (!id) return;
      const text = tab.state.local.items[id].text
      return creators.update(id, {
        text: text.slice(0, text.length / 2),
      });
    },
  ];

  // prefer toggling
  things.push(things[1])
  things.push(things[1])
  things.push(things[1])
  things.push(things[1])
  things.push(things[1])
  things.push(things[1])
  things.push(things[1])
  things.push(things[1])
  things.push(things[0])

  window.doSth = () => {
    let action = pick(things)();
    while (!action) {
      action = pick(things)();
    }
    tab.addAction(action);
  };

  window.rando = (num, wait, iwait) => {
    setTimeout(() => {
      doSth();
      if (num > 1) {
        setTimeout(() => rando(num - 1, wait), wait);
      }
    }, iwait || 0);
  };
}
