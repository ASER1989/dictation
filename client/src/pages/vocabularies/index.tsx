import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@client/components/button";
import Textarea from "@client/components/textarea";
import {
  createVocabulary,
  deleteVocabulary,
  fetchVocabularyBooks,
  updateVocabulary,
} from "@client/models/vocabularyApi";
import type { VocabularyBook, VocabularyBookPayload } from "@client/types/vocabulary";
import "./index.styl";

type FormState = {
  name: string;
  grade: string;
  version: string;
  unit: string;
  lesson: string;
  wordsText: string;
};

const defaultFormState: FormState = {
  name: "",
  grade: "",
  version: "",
  unit: "",
  lesson: "",
  wordsText: "",
};

function wordsToText(words: string[]): string {
  return words.join("\n");
}

function parseWords(input: string): string[] {
  return input
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toPayload(form: FormState): VocabularyBookPayload {
  return {
    name: form.name.trim(),
    grade: form.grade.trim(),
    version: form.version.trim(),
    unit: form.unit.trim(),
    lesson: form.lesson.trim(),
    words: parseWords(form.wordsText),
  };
}

function validateForm(payload: VocabularyBookPayload): string | null {
  if (!payload.name) {
    return "请填写词汇表名称";
  }
  if (!payload.grade) {
    return "请填写年级";
  }
  if (!payload.version) {
    return "请填写版本";
  }
  if (!payload.unit) {
    return "请填写课程单元";
  }
  return null;
}

export default function VocabulariesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<VocabularyBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultFormState);

  const isEditing = editingId !== null;
  const hasItems = items.length > 0;

  const submitLabel = useMemo(() => {
    if (saving) {
      return "提交中...";
    }
    return isEditing ? "保存修改" : "新建词汇表";
  }, [isEditing, saving]);

  const loadItems = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchVocabularyBooks();
      setItems(data);
    } catch (error) {
      setErrorMessage((error as Error).message || "加载词汇表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleInputChange = (key: keyof FormState, value: string) => {
    setForm((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setEditingId(null);
    setForm(defaultFormState);
    setErrorMessage(null);
  };

  const handleEdit = (item: VocabularyBook) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      grade: item.grade,
      version: item.version,
      unit: item.unit,
      lesson: item.lesson,
      wordsText: wordsToText(item.words),
    });
    setErrorMessage(null);
  };

  const handleDelete = async (item: VocabularyBook) => {
    const confirmed = window.confirm(`确认删除词汇表「${item.name}」吗？`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteVocabulary(item.id);
      await loadItems();
      if (editingId === item.id) {
        handleReset();
      }
    } catch (error) {
      setErrorMessage((error as Error).message || "删除失败");
    }
  };

  const handleSubmit = async () => {
    const payload = toPayload(form);
    const validationError = validateForm(payload);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      if (editingId) {
        await updateVocabulary(editingId, payload);
      } else {
        await createVocabulary(payload);
      }
      await loadItems();
      handleReset();
    } catch (error) {
      setErrorMessage((error as Error).message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate("/books");
  };

  return (
    <div className="vocab-page">
      <div className="vocab-layout">
        <div className="vocab-panel form-panel">
          <div className="panel-head">
            <div className="panel-title">{isEditing ? "编辑词汇表" : "新建词汇表"}</div>
            <Button onClick={handleBack}>返回选择页</Button>
          </div>

          <div className="form-field">
            <label>词汇表名称</label>
            <input
              value={form.name}
              onChange={(event) => handleInputChange("name", event.target.value)}
              placeholder="例如：一年级上 人教版 第一单元"
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>年级</label>
              <input
                value={form.grade}
                onChange={(event) => handleInputChange("grade", event.target.value)}
                placeholder="例如：一年级上"
              />
            </div>
            <div className="form-field">
              <label>版本</label>
              <input
                value={form.version}
                onChange={(event) => handleInputChange("version", event.target.value)}
                placeholder="例如：人教版语文"
              />
            </div>
            <div className="form-field">
              <label>课程单元</label>
              <input
                value={form.unit}
                onChange={(event) => handleInputChange("unit", event.target.value)}
                placeholder="例如：第一单元"
              />
            </div>
            <div className="form-field">
              <label>课文</label>
              <input
                value={form.lesson}
                onChange={(event) => handleInputChange("lesson", event.target.value)}
                placeholder="例如：第1课"
              />
            </div>
          </div>

          <div className="form-field">
            <label>词汇（按行或逗号分隔）</label>
            <Textarea
              value={form.wordsText}
              onChange={(value) => handleInputChange("wordsText", value || "")}
              placeholder={"例如：\n天地\n你我他"}
            />
          </div>

          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <div className="form-actions">
            <Button type="primary" onClick={handleSubmit} disabeld={saving}>
              {submitLabel}
            </Button>
            <Button onClick={handleReset} disabeld={saving}>
              重置
            </Button>
          </div>
        </div>

        <div className="vocab-panel list-panel">
          <div className="panel-title">词汇表列表</div>

          {loading && <div className="list-tip">加载中...</div>}
          {!loading && !hasItems && <div className="list-tip">暂无词汇表，请先新建。</div>}

          {!loading && hasItems && (
            <div className="list-wrap">
              {items.map((item) => (
                <div className="list-item" key={item.id}>
                  <div className="item-main">
                    <div className="item-title">{item.name}</div>
                    <div className="item-meta">
                      {item.grade} / {item.version} / {item.unit}
                      {item.lesson ? ` / ${item.lesson}` : ""}
                    </div>
                    <div className="item-words">{item.words.join("、") || "（无词汇）"}</div>
                  </div>
                  <div className="item-actions">
                    <Button onClick={() => handleEdit(item)}>编辑</Button>
                    <Button onClick={() => handleDelete(item)}>删除</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
