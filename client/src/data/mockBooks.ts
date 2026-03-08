import type { BookUnit } from "@client/types/books";

export const mockBooks: BookUnit[] = [
  {
    id: "unit-1",
    name: "第一单元",
    lessons: [
      {
        id: "lesson-1",
        name: "第1课",
        vocabularyId: "mock-lesson-1-1",
        wordCount: 5,
      },
      {
        id: "lesson-2",
        name: "第2课",
        vocabularyId: "mock-lesson-1-2",
        wordCount: 5,
      },
    ],
  },
  {
    id: "unit-2",
    name: "第二单元",
    lessons: [
      {
        id: "lesson-1",
        name: "第1课",
        vocabularyId: "mock-lesson-2-1",
        wordCount: 5,
      },
    ],
  },
];
