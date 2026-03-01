import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@client/components/button";
import { fetchClientBooksTree } from "@client/models/vocabularyApi";
import type { BookGrade, BookSelection, DictationRouteState } from "@client/types/books";
import "./index.styl";

type SelectionDraft = Partial<BookSelection>;

export default function BooksPage() {
  const navigate = useNavigate();
  const [bookData, setBookData] = useState<BookGrade[]>([]);
  const [selection, setSelection] = useState<SelectionDraft>({});

  useEffect(() => {
    let disposed = false;

    const loadBookData = async () => {
      try {
        const tree = await fetchClientBooksTree();
        if (!disposed) {
          setBookData(tree);
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

  const versions = useMemo(() => {
    const grade = bookData.find((item) => item.id === selection.gradeId);
    return grade?.versions ?? [];
  }, [bookData, selection.gradeId]);

  const units = useMemo(() => {
    const version = versions.find((item) => item.id === selection.versionId);
    return version?.units ?? [];
  }, [versions, selection.versionId]);

  const lessons = useMemo(() => {
    const unit = units.find((item) => item.id === selection.unitId);
    return unit?.lessons ?? [];
  }, [units, selection.unitId]);

  const selectedLesson = useMemo(() => {
    return lessons.find((item) => item.id === selection.lessonId);
  }, [lessons, selection.lessonId]);

  const canStart = Boolean(
    selection.gradeId &&
      selection.versionId &&
      selection.unitId &&
      selection.lessonId &&
      selectedLesson &&
      selectedLesson.wordCount > 0,
  );

  const handleGradeChange = (value: string) => {
    setSelection({
      gradeId: value || undefined,
      versionId: undefined,
      unitId: undefined,
      lessonId: undefined,
    });
  };

  const handleVersionChange = (value: string) => {
    setSelection((prevState) => ({
      ...prevState,
      versionId: value || undefined,
      unitId: undefined,
      lessonId: undefined,
    }));
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
    if (
      !canStart ||
      !selectedLesson ||
      !selection.gradeId ||
      !selection.versionId ||
      !selection.unitId ||
      !selection.lessonId
    ) {
      return;
    }

    const state: DictationRouteState = {
      selection: {
        gradeId: selection.gradeId,
        versionId: selection.versionId,
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
        <div className="books-subtitle">按年级、版本、单元和课文选择后开始听写</div>

        <div className="books-field">
          <div className="books-label">年级</div>
          <select
            value={selection.gradeId ?? ""}
            onChange={(event) => handleGradeChange(event.target.value)}
          >
            <option value="">请选择年级</option>
            {bookData.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>
        </div>

        <div className="books-field">
          <div className="books-label">版本</div>
          <select
            value={selection.versionId ?? ""}
            onChange={(event) => handleVersionChange(event.target.value)}
            disabled={!selection.gradeId}
          >
            <option value="">请选择版本</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.name}
              </option>
            ))}
          </select>
        </div>

        <div className="books-field">
          <div className="books-label">单元</div>
          <select
            value={selection.unitId ?? ""}
            onChange={(event) => handleUnitChange(event.target.value)}
            disabled={!selection.versionId}
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
