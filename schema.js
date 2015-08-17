
type BookID = string;
type Chapter = number;
type Verse = number;
type Word = number;

type Reference = [BookID, Chapter, Verse, Word];

type TagID = string;
type NodeID = string;
type UserID = string;
type StudyID = string;
type AnnotationID = string;
type CategoryID = string;

type Style = 'underline' | 'highlight' | 'sideline' | 'hidden';
type Color = string; // 'auto' to take the color of the first tag

type Annotation = {
  id: AnnotationID,
  // where
  study: StudyID,
  start: Reference,
  end: Reference,

  author: UserID,
  created: Date,
  updated: Date,

  // look
  style: Style,
  color: Color,

  // attachments
  tags: Array<TagID>,
  // Lives on the Note
  // notes: Array<NodeID>,
};

type Note = {
  id: NodeID,
  title: string,
  body: string,

  annotation: AnnotationID,
  author: UserID,
  created: Date,
  updated: Date,
};

type Tag = {
  name: string,
  category: ?CategoryID,
  author: UserID,
  color: Color,
};

type Category = {
  id: CategoryID,
  name: string,
  author: UserID,
};
