export type BookSelection = {
  unitId: string;
  lessonId: string;
};

export type BookLesson = {
  id: string;
  name: string;
  vocabularyId: string;
  wordCount: number;
};

export type BookUnit = {
  id: string;
  name: string;
  lessons: BookLesson[];
};

export type DictationRouteState = {
  selection: BookSelection;
  vocabularyId: string;
};
