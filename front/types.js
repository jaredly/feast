/**
 * @flow
 */

export type MarkID = string;

export type Marks = {
  [key: MarkID]: Mark;
};

export type SideCoords = {
  [key: MarkID]: {top: number, bottom: number, left: number},
};

export type WordRef = {
  verse: number,
  word: number,
};

export type Target = WordRef | {
  word: false,
  verse: number,
  left: number,
  right: number,
};

export type MarkStyle = {
  color: string,
  underline?: boolean,
};

export type MarkType = 'sideline' | 'highlight';

export type Mark = {
  id: MarkID,
  start: WordRef,
  end: WordRef,
  type?: MarkType,
  style: MarkStyle,
};

export type Context = {
  fillText: (word: string, x: number, y: number) => void,
  measureText: (word: string) => {width: number},
};

export type FontConfig = {
  space: number,
  size: number,
  indent: number,
  family: string,
  lineHeight: number,
};

export type SizeConfig = {
  vmargin: number,
  hmargin: number,
  width: number,
  height: number,

};

export type Verses = Array<{words: Array<string>}>;

export type Lines = Array<{verse: number, word: number, top: number, left: number, right: number}>;

export type Pos = Array<Array<{left: number, top: number, width: number, line: number}>>;
