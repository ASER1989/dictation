export type VocabularyBook = {
  id: string;
  name: string;
  grade: string;
  version: string;
  unit: string;
  lesson: string;
  words: string[];
  wordAudios?: WordAudioItem[];
  createdAt: string;
  updatedAt: string;
};

export type WordAudioItem = {
  word: string;
  audioFileName: string;
  audioRelativePath: string;
};

export type VocabularyBookPayload = {
  name: string;
  grade: string;
  version: string;
  unit: string;
  lesson: string;
  words: string[];
};

export type ClientVocabularyItem = {
  id: string;
  name: string;
  grade: string;
  version: string;
  unit: string;
  lesson: string;
  wordCount: number;
};

export type DictationWordItem = {
  word: string;
  audioUrl: string;
};

export type DictationData = {
  book: {
    id: string;
    name: string;
    grade: string;
    version: string;
    unit: string;
    lesson: string;
  };
  repeatTimes: number;
  intervalSeconds: number;
  words: DictationWordItem[];
};
