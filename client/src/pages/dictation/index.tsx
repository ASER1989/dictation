import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "@client/components/button";
import { fetchDictationData } from "@client/models/vocabularyApi";
import type { DictationRouteState } from "@client/types/books";
import type { DictationWordItem } from "@client/types/vocabulary";
import "./index.styl";

function isValidRouteState(state: unknown): state is DictationRouteState {
  if (!state || typeof state !== "object") {
    return false;
  }

  const routeState = state as DictationRouteState;
  return (
    !!routeState.selection &&
    typeof routeState.selection.gradeId === "string" &&
    typeof routeState.selection.versionId === "string" &&
    typeof routeState.selection.unitId === "string" &&
    typeof routeState.selection.lessonId === "string" &&
    typeof routeState.vocabularyId === "string"
  );
}

export default function DictationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isPreparing, setIsPreparing] = useState(false);
  const [dictationWords, setDictationWords] = useState<DictationWordItem[]>([]);
  const [repeatTimes, setRepeatTimes] = useState(3);
  const [intervalSeconds, setIntervalSeconds] = useState(6);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playTaskIdRef = useRef(0);
  const prepareTaskIdRef = useRef(0);
  const completionAnnouncedRef = useRef(false);

  const routeState = useMemo(() => {
    return isValidRouteState(location.state) ? location.state : null;
  }, [location.state]);

  const clearPlayback = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  const stopPlaybackTask = useCallback(() => {
    playTaskIdRef.current += 1;
    clearPlayback();
  }, [clearPlayback]);

  const stopPrepareTask = useCallback(() => {
    prepareTaskIdRef.current += 1;
    setIsPreparing(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const playPrepareAnnouncement = useCallback(async () => {
    const taskId = ++prepareTaskIdRef.current;
    setIsPreparing(true);

    const finish = () => {
      if (taskId === prepareTaskIdRef.current) {
        setIsPreparing(false);
      }
    };

    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      finish();
      return;
    }

    await new Promise<void>((resolve) => {
      let completed = false;
      const complete = () => {
        if (completed) {
          return;
        }
        completed = true;
        window.clearTimeout(timeoutId);
        resolve();
      };

      const timeoutId = window.setTimeout(complete, 5000);

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("听写即将开始，请准备");
        utterance.lang = "zh-CN";
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.onend = complete;
        utterance.onerror = complete;
        window.speechSynthesis.speak(utterance);
      } catch {
        complete();
      }
    });

    finish();
  }, []);

  const playCompletionAnnouncement = useCallback(() => {
    if (completionAnnouncedRef.current) {
      return;
    }

    completionAnnouncedRef.current = true;

    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      return;
    }

    setCurrentIndex((prevState) => Math.min(prevState + 1, dictationWords.length - 1));
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("听写完成，请检查听写情况。");
      utterance.lang = "zh-CN";
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore synthesis errors
    }
  }, []);

  useEffect(() => {
    if (!routeState) {
      navigate("/books", { replace: true });
    }
  }, [navigate, routeState]);

  useEffect(() => {
    if (!routeState) {
      return;
    }

    let disposed = false;
    setLoading(true);
    setCurrentIndex(0);
    completionAnnouncedRef.current = false;
    stopPrepareTask();
    stopPlaybackTask();

    const loadDictationWords = async () => {
      try {
        const data = await fetchDictationData(routeState.vocabularyId);
        if (disposed) {
          return;
        }
        setDictationWords(data.words);
        setRepeatTimes(data.repeatTimes);
        setIntervalSeconds(data.intervalSeconds);
        setIsPaused(false);
        void playPrepareAnnouncement();
      } catch (error) {
        if (!disposed) {
          window.alert((error as Error).message || "词汇加载失败");
          navigate("/books", { replace: true });
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    loadDictationWords();

    return () => {
      disposed = true;
      stopPrepareTask();
      stopPlaybackTask();
    };
  }, [navigate, playPrepareAnnouncement, routeState, stopPlaybackTask, stopPrepareTask]);

  useEffect(() => {
    if (currentIndex < Math.max(dictationWords.length - 1, 0)) {
      completionAnnouncedRef.current = false;
    }
  }, [currentIndex, dictationWords.length]);

  useEffect(() => {
    if (loading || isPaused || isPreparing || dictationWords.length === 0) {
      return;
    }

    const currentWord = dictationWords[currentIndex];
    if (!currentWord) {
      return;
    }

    const taskId = ++playTaskIdRef.current;
    clearPlayback();

    const playByRound = (roundIndex: number) => {
      if (taskId !== playTaskIdRef.current || isPaused) {
        return;
      }

      const audio = new Audio(currentWord.audioUrl);
      audioRef.current = audio;

      let scheduled = false;
      const scheduleNextStep = () => {
        if (scheduled) {
          return;
        }
        scheduled = true;

        if (taskId !== playTaskIdRef.current || isPaused) {
          return;
        }

        timerRef.current = window.setTimeout(() => {
          if (taskId !== playTaskIdRef.current || isPaused) {
            return;
          }

          if (roundIndex + 1 < repeatTimes) {
            playByRound(roundIndex + 1);
            return;
          }

          if (currentIndex < dictationWords.length - 1) {
            setCurrentIndex((prevState) => Math.min(prevState + 1, dictationWords.length - 1));
            return;
          }

          playCompletionAnnouncement();
        }, Math.max(1, intervalSeconds) * 1000);
      };

      audio.onended = scheduleNextStep;
      audio.onerror = scheduleNextStep;

      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => scheduleNextStep());
      }
    };

    playByRound(0);

    return () => {
      if (taskId === playTaskIdRef.current) {
        clearPlayback();
      }
    };
  }, [
    clearPlayback,
    currentIndex,
    dictationWords,
    intervalSeconds,
    isPreparing,
    isPaused,
    loading,
    playCompletionAnnouncement,
    repeatTimes,
  ]);

  if (!routeState) {
    return null;
  }

  const totalCount = dictationWords.length;
  const completedCount = totalCount === 0 ? 0 : Math.min(currentIndex, totalCount);
  const remainingCount = Math.max(totalCount - completedCount, 0);

  const isPrevDisabled = loading || isPreparing || currentIndex === 0;
  const isNextDisabled = loading || isPreparing || currentIndex >= dictationWords.length - 1;
  const isPauseDisabled = loading || isPreparing || dictationWords.length === 0;

  const handlePrev = () => {
    stopPlaybackTask();
    setCurrentIndex((prevState) => Math.max(0, prevState - 1));
  };

  const handleNext = () => {
    stopPlaybackTask();
    setCurrentIndex((prevState) => Math.min(dictationWords.length - 1, prevState + 1));
  };

  const handlePauseToggle = () => {
    setIsPaused((prevState) => {
      const nextState = !prevState;
      if (nextState) {
        stopPlaybackTask();
      }
      return nextState;
    });
  };

  return (
    <div className="dictation-page">
      <div className="dictation-board">
        <div className="dictation-progress">
          已完成 {completedCount} 个，剩余 {remainingCount} 个
        </div>
        <div className="dictation-actions">
          <div className="dictation-btn dictation-btn-prev">
            <Button onClick={handlePrev} disabeld={isPrevDisabled}>
              上一个
            </Button>
          </div>
          <div className="dictation-btn dictation-btn-pause">
            <Button type="primary" onClick={handlePauseToggle} disabeld={isPauseDisabled}>
              {isPaused ? "继续" : "暂停"}
            </Button>
          </div>
          <div className="dictation-btn dictation-btn-next">
            <Button onClick={handleNext} disabeld={isNextDisabled}>
              下一个
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
