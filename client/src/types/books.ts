export type BookSelection = {
  gradeId: string;
  versionId: string;
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

export type BookVersion = {
  id: string;
  name: string;
  units: BookUnit[];
};

export type BookGrade = {
  id: string;
  name: string;
  versions: BookVersion[];
};

export type DictationRouteState = {
  selection: BookSelection;
  vocabularyId: string;
};
