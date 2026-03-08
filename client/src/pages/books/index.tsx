import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@client/components/button";
import { fetchClientVocabularyBooks } from "@client/models/vocabularyApi";
import type { BookSelection, DictationRouteState } from "@client/types/books";
import type { ClientVocabularyItem } from "@client/types/vocabulary";
import "./index.styl";

type SelectionDraft = {
  bookId?: string;
} & Partial<BookSelection>;

type LessonOption = {
  id: string;
  name: string;
  vocabularyId: string;
  wordCount: number;
};

type UnitOption = {
  id: string;
  name: string;
  lessons: LessonOption[];
};

type BookOption = {
  id: string;
  name: string;
  units: UnitOption[];
};

function formatId(prefix: string, value: string) {
  return `${prefix}-${value.trim().toLowerCase().replace(/\s+/g, "-")}`;
}

function buildBookOptions(items: ClientVocabularyItem[]): BookOption[] {
  const bookMap = new Map<string, BookOption>();

  items.forEach((item) => {
    const bookName = item.name.trim();
    const unitName = item.unit.trim();
    const lessonName = item.lesson.trim() || bookName;

    if (!bookName || !unitName || !lessonName) {
      return;
    }

    const bookId = formatId("book", bookName);
    const unitId = formatId("unit", `${bookName}-${unitName}`);

    if (!bookMap.has(bookId)) {
      bookMap.set(bookId, {
        id: bookId,
        name: bookName,
        units: [],
      });
    }

    const book = bookMap.get(bookId)!;
    let unit = book.units.find((unitItem) => unitItem.id === unitId);
    if (!unit) {
      unit = {
        id: unitId,
        name: unitName,
        lessons: [],
      };
      book.units.push(unit);
    }

    unit.lessons.push({
      id: item.id,
      name: lessonName,
      vocabularyId: item.id,
      wordCount: item.wordCount,
    });
  });

  return Array.from(bookMap.values());
}

export default function BooksPage() {
  const navigate = useNavigate();
  const [bookData, setBookData] = useState<BookOption[]>([]);
  const [selection, setSelection] = useState<SelectionDraft>({});

  useEffect(() => {
    let disposed = false;

    const loadBookData = async () => {
      try {
        const list = await fetchClientVocabularyBooks();
        if (!disposed) {
          setBookData(buildBookOptions(list));
        }
      } catch {
        if (!disposed) {
          setBookData([]);
        }
      }
    };

    loadBookData();

    return () => {
      disposed = true;
    };
  }, []);

  const units = useMemo(() => {
    const book = bookData.find((item) => item.id === selection.bookId);
    return book?.units ?? [];
  }, [bookData, selection.bookId]);

  const lessons = useMemo(() => {
    const unit = units.find((item) => item.id === selection.unitId);
    return unit?.lessons ?? [];
  }, [units, selection.unitId]);

  const selectedLesson = useMemo(() => {
    return lessons.find((item) => item.id === selection.lessonId);
  }, [lessons, selection.lessonId]);

  const canStart = Boolean(
    selection.bookId &&
      selection.unitId &&
      selection.lessonId &&
      selectedLesson &&
      selectedLesson.wordCount > 0,
  );

  const handleBookChange = (value: string) => {
    setSelection({
      bookId: value || undefined,
      unitId: undefined,
      lessonId: undefined,
    });
  };

  const handleUnitChange = (value: string) => {
    setSelection((prevState) => ({
      ...prevState,
      unitId: value || undefined,
      lessonId: undefined,
    }));
  };

  const handleLessonChange = (value: string) => {
    setSelection((prevState) => ({
      ...prevState,
      lessonId: value || undefined,
    }));
  };

  const handleStart = () => {
    if (!canStart || !selectedLesson || !selection.unitId || !selection.lessonId) {
      return;
    }

    const state: DictationRouteState = {
      selection: {
        unitId: selection.unitId,
        lessonId: selection.lessonId,
      },
      vocabularyId: selectedLesson.vocabularyId,
    };

    navigate("/dictation", { state });
  };

  const handleGoManage = () => {
    navigate("/vocabularies");
  };

  return (
    <div className="books-page">
      <div className="books-card">
        <div className="books-head">
          <div className="books-title">选择词汇本</div>
          <Button onClick={handleGoManage}>词汇表管理</Button>
        </div>
        <div className="books-subtitle">按词汇表名称、单元和课文选择后开始听写</div>

        <div className="books-field">
          <div className="books-label">词汇表名称</div>
          <select
            value={selection.bookId ?? ""}
            onChange={(event) => handleBookChange(event.target.value)}
          >
            <option value="">请选择词汇表名称</option>
            {bookData.map((book) => (
              <option key={book.id} value={book.id}>
                {book.name}
              </option>
            ))}
          </select>
        </div>

        <div className="books-field">
          <div className="books-label">单元</div>
          <select
            value={selection.unitId ?? ""}
            onChange={(event) => handleUnitChange(event.target.value)}
            disabled={!selection.bookId}
          >
            <option value="">请选择单元</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>

        <div className="books-field">
          <div className="books-label">课文</div>
          <select
            value={selection.lessonId ?? ""}
            onChange={(event) => handleLessonChange(event.target.value)}
            disabled={!selection.unitId}
          >
            <option value="">请选择课文</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
        </div>

        <div className="books-actions">
          <Button type="primary" disabeld={!canStart} onClick={handleStart}>
            开始听写
          </Button>
        </div>
      </div>
    </div>
  );
}
