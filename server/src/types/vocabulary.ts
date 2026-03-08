export type VocabularyBook = {
  id: string;
  name: string;
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

export type VocabularyBookInput = {
  name: string;
  unit: string;
  lesson?: string;
  words?: string[];
};
