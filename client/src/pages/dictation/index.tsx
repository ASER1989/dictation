import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "@client/components/button";
import { useDictationPlayback } from "@client/hooks/useDictationPlayback";
import { useDictationPreload } from "@client/hooks/useDictationPreload";
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
    typeof routeState.selection.unitId === "string" &&
    typeof routeState.selection.lessonId === "string" &&
    typeof routeState.vocabularyId === "string"
  );
}

export default function DictationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dictationWords, setDictationWords] = useState<DictationWordItem[]>([]);
  const [repeatTimes, setRepeatTimes] = useState(3);
  const [intervalSeconds, setIntervalSeconds] = useState(6);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { isPreparing, playPrepareAnnouncement, stopPrepareTask, stopPlaybackTask } =
    useDictationPlayback({
      dictationWords,
      repeatTimes,
      intervalSeconds,
      loading,
      currentIndex,
      isPaused,
      setCurrentIndex,
    });

  const { resetPreload } = useDictationPreload({ dictationWords, currentIndex, loading });

  const routeState = useMemo(() => {
    return isValidRouteState(location.state) ? location.state : null;
  }, [location.state]);

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
    stopPrepareTask();
    stopPlaybackTask();
    resetPreload();

    const loadDictationWords = async () => {
      try {
        const data = await fetchDictationData(routeState.vocabularyId);
        if (disposed) {
          return;
        }
        setDictationWords(data.words);
        // setRepeatTimes(data.repeatTimes);
        // setIntervalSeconds(data.intervalSeconds);
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
      resetPreload();
    };
  }, [
    navigate,
    playPrepareAnnouncement,
    routeState,
    stopPlaybackTask,
    stopPrepareTask,
    resetPreload,
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
