import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@client/components/button";
import Textarea from "@client/components/textarea";
import {
  createVocabulary,
  deleteVocabulary,
  fetchVocabularyBooks,
  regenerateVocabularyAudio,
  updateVocabulary,
} from "@client/models/vocabularyApi";
import type { RegenerateAudioOptions } from "@client/models/vocabularyApi";
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

const regenerateVoiceOptions: Array<{
  label: string;
  value: NonNullable<RegenerateAudioOptions["voice"]>;
}> = [
  { label: "tongtong", value: "tongtong" },
  { label: "chuichui", value: "chuichui" },
  { label: "xiaochen", value: "xiaochen" },
  { label: "jam", value: "jam" },
  { label: "kazi", value: "kazi" },
  { label: "douji", value: "douji" },
  { label: "luodo", value: "luodo" },
];

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
  const [playingWordKey, setPlayingWordKey] = useState<string | null>(null);
  const [regeneratingWordKey, setRegeneratingWordKey] = useState<string | null>(null);
  const [regenerateVoice, setRegenerateVoice] = useState<
    NonNullable<RegenerateAudioOptions["voice"]>
  >("tongtong");
  const [regenerateSpeed, setRegenerateSpeed] = useState<string>("1");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultFormState);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
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

  const getWordAudioFileName = (item: VocabularyBook, word: string) => {
    const match = item.wordAudios?.find((audioItem) => audioItem.word === word.trim());
    return match?.audioFileName;
  };

  const handlePreviewWordAudio = (item: VocabularyBook, word: string, index: number) => {
    const fileName = getWordAudioFileName(item, word);
    if (!fileName) {
      setErrorMessage(`词汇「${word}」暂无可试听音频，请先重新生成`);
      return;
    }

    const wordKey = `${item.id}-${index}`;
    setErrorMessage(null);

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
    }

    const audio = new Audio(`/api/client/audio/${fileName}?t=${Date.now()}`);
    previewAudioRef.current = audio;
    setPlayingWordKey(wordKey);

    const clearPlaying = () => {
      if (previewAudioRef.current === audio) {
        previewAudioRef.current = null;
      }
      setPlayingWordKey((prevState) => (prevState === wordKey ? null : prevState));
    };

    audio.onended = clearPlaying;
    audio.onerror = clearPlaying;

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => clearPlaying());
    }
  };

  const handleRegenerateWordAudio = async (item: VocabularyBook, word: string, index: number) => {
    const speedNumber = Number(regenerateSpeed);
    if (!Number.isFinite(speedNumber) || speedNumber < 0.5 || speedNumber > 2) {
      setErrorMessage("语速参数必须在 0.5 到 2 之间");
      return;
    }

    const wordKey = `${item.id}-${index}`;
    setRegeneratingWordKey(wordKey);
    setErrorMessage(null);

    try {
      const updatedItem = await regenerateVocabularyAudio(item.id, word, {
        voice: regenerateVoice,
        speed: speedNumber,
      });
      setItems((prevState) =>
        prevState.map((currentItem) => (currentItem.id === updatedItem.id ? updatedItem : currentItem)),
      );
    } catch (error) {
      setErrorMessage((error as Error).message || "重新生成音频失败");
    } finally {
      setRegeneratingWordKey(null);
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
          <div className="audio-regenerate-config">
            <div className="audio-config-item">
              <label>音色</label>
              <select
                value={regenerateVoice}
                onChange={(event) =>
                  setRegenerateVoice(event.target.value as NonNullable<RegenerateAudioOptions["voice"]>)
                }
              >
                {regenerateVoiceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="audio-config-item">
              <label>语速</label>
              <input
                type="number"
                min={0.5}
                max={2}
                step={0.1}
                value={regenerateSpeed}
                onChange={(event) => setRegenerateSpeed(event.target.value)}
              />
            </div>
          </div>

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
                    <div className="item-words-summary">词汇数量：{item.words.length}</div>
                    <div className="item-word-list">
                      {item.words.length === 0 && <div className="item-word-empty">（无词汇）</div>}
                      {item.words.map((word, index) => {
                        const wordKey = `${item.id}-${index}`;
                        const hasAudio = Boolean(getWordAudioFileName(item, word));
                        const isPlaying = playingWordKey === wordKey;
                        const isRegenerating = regeneratingWordKey === wordKey;

                        return (
                          <div className="word-row" key={wordKey}>
                            <div className="word-label">{word}</div>
                            <div className="word-actions">
                              <Button
                                onClick={() => handlePreviewWordAudio(item, word, index)}
                                disabeld={!hasAudio || isRegenerating}
                              >
                                {isPlaying ? "播放中" : "试听"}
                              </Button>
                              <Button
                                onClick={() => handleRegenerateWordAudio(item, word, index)}
                                disabeld={isRegenerating}
                              >
                                {isRegenerating ? "生成中" : "重新生成"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
