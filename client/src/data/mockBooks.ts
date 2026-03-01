import type { BookGrade } from "@client/types/books";

export const mockBooks: BookGrade[] = [
  {
    id: "grade-1-term-1",
    name: "一年级上",
    versions: [
      {
        id: "rjb-yuwen",
        name: "人教版语文",
        units: [
          {
            id: "unit-1",
            name: "第一单元",
            lessons: [
              {
                id: "lesson-1",
                name: "第1课",
                vocabularyId: "mock-lesson-1-1-1-1",
                wordCount: 5,
              },
              {
                id: "lesson-2",
                name: "第2课",
                vocabularyId: "mock-lesson-1-1-1-2",
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
                vocabularyId: "mock-lesson-1-1-2-1",
                wordCount: 5,
              },
              {
                id: "lesson-2",
                name: "第2课",
                vocabularyId: "mock-lesson-1-1-2-2",
                wordCount: 5,
              },
            ],
          },
        ],
      },
      {
        id: "bjb-yuwen",
        name: "北师大版语文",
        units: [
          {
            id: "unit-1",
            name: "第一单元",
            lessons: [
              {
                id: "lesson-1",
                name: "第1课",
                vocabularyId: "mock-lesson-1-2-1-1",
                wordCount: 5,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "grade-2-term-1",
    name: "二年级上",
    versions: [
      {
        id: "rjb-yuwen",
        name: "人教版语文",
        units: [
          {
            id: "unit-1",
            name: "第一单元",
            lessons: [
              {
                id: "lesson-1",
                name: "第1课",
                vocabularyId: "mock-lesson-2-1-1-1",
                wordCount: 5,
              },
              {
                id: "lesson-2",
                name: "第2课",
                vocabularyId: "mock-lesson-2-1-1-2",
                wordCount: 5,
              },
            ],
          },
        ],
      },
    ],
  },
];
