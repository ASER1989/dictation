import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { DictationWordItem } from "@client/types/vocabulary";
import { getAudioContextCtor } from "./audioContext";

const PLAYBACK_TIMEOUT_MS = 8000;

export type DictationPlaybackOptions = {
  dictationWords: DictationWordItem[];
  repeatTimes: number;
  intervalSeconds: number;
  loading: boolean;
  currentIndex: number;
  isPaused: boolean;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
};

export type DictationPlaybackHandle = {
  isPreparing: boolean;
  playPrepareAnnouncement: () => Promise<void>;
  stopPrepareTask: () => void;
  stopPlaybackTask: () => void;
  replayCurrent: () => void;
};

export const useDictationPlayback = ({
  dictationWords,
  repeatTimes,
  intervalSeconds,
  loading,
  currentIndex,
  isPaused,
  setCurrentIndex,
}: DictationPlaybackOptions): DictationPlaybackHandle => {
  const [isPreparing, setIsPreparing] = useState(false);
  const [replayNonce, setReplayNonce] = useState(0);
  const timerRef = useRef<number | null>(null);
  const playTaskIdRef = useRef(0);
  const prepareTaskIdRef = useRef(0);
  const completionAnnouncedRef = useRef(false);
  const contextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playControllersRef = useRef<Set<AbortController>>(new Set());

  const clearPlayback = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    for (const controller of playControllersRef.current) {
      controller.abort();
    }
    playControllersRef.current.clear();

    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.onended = null;
        activeSourceRef.current.stop();
      } catch {
        // ignore stop errors
      }
      try {
        activeSourceRef.current.disconnect();
      } catch {
        // ignore disconnect errors
      }
      activeSourceRef.current = null;
    }
  }, []);

  const stopPlaybackTask = useCallback(() => {
    playTaskIdRef.current += 1;
    clearPlayback();
  }, [clearPlayback]);

  const replayCurrent = useCallback(() => {
    stopPlaybackTask();
    setReplayNonce((prev) => prev + 1);
  }, [stopPlaybackTask]);

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

      const timeoutId = window.setTimeout(complete, Math.max(1, intervalSeconds) * 1000);

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("听写即将开始，请准备");
        utterance.lang = "zh-CN";
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        // utterance.onend = complete;
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

    setCurrentIndex((prevState) => Math.min(prevState + 1, dictationWords.length - 1));

    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      return;
    }

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
  }, [dictationWords.length, setCurrentIndex]);

  useEffect(() => {
    completionAnnouncedRef.current = false;
  }, [dictationWords]);

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

    const AudioContextCtor = getAudioContextCtor();
    if (!AudioContextCtor) {
      return;
    }

    const taskId = ++playTaskIdRef.current;
    clearPlayback();

    let audioBuffer: AudioBuffer | null = null;

    const ensureContext = async () => {
      if (!contextRef.current || contextRef.current.state === "closed") {
        contextRef.current = new AudioContextCtor();
      }
      const context = contextRef.current;
      if (!context) {
        return null;
      }
      if (context.state === "suspended") {
        try {
          await context.resume();
        } catch {
          // ignore resume errors
        }
      }
      return context;
    };

    const loadBuffer = async () => {
      if (audioBuffer) {
        return audioBuffer;
      }

      const context = await ensureContext();
      if (!context) {
        return null;
      }

      const controller = new AbortController();
      playControllersRef.current.add(controller);

      let resolvedBuffer: AudioBuffer | null = null;
      const timeoutId = window.setTimeout(() => {
        controller.abort();
      }, PLAYBACK_TIMEOUT_MS);

      try {
        const response = await fetch(currentWord.audioUrl, {
          signal: controller.signal,
          cache: "force-cache",
        });
        const buffer = await response.arrayBuffer();
        if (taskId !== playTaskIdRef.current) {
          return null;
        }
        resolvedBuffer = await context.decodeAudioData(buffer);
        audioBuffer = resolvedBuffer;
        return resolvedBuffer;
      } catch {
        return null;
      } finally {
        window.clearTimeout(timeoutId);
        playControllersRef.current.delete(controller);
      }
    };

    const playByRound = async (roundIndex: number) => {
      if (taskId !== playTaskIdRef.current || isPaused) {
        return;
      }

      const context = await ensureContext();
      if (!context) {
        return;
      }

      const buffer = await loadBuffer();
      if (!buffer) {
        scheduleNextStep(roundIndex);
        return;
      }

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      activeSourceRef.current = source;

      source.onended = () => {
        if (activeSourceRef.current === source) {
          activeSourceRef.current = null;
        }
        try {
          source.disconnect();
        } catch {
          // ignore disconnect errors
        }
        scheduleNextStep(roundIndex);
      };

      try {
        source.start(0);
      } catch {
        try {
          source.disconnect();
        } catch {
          // ignore disconnect errors
        }
        scheduleNextStep(roundIndex);
      }
    };

    const scheduleNextStep = (roundIndex: number) => {
      if (taskId !== playTaskIdRef.current || isPaused) {
        return;
      }

      timerRef.current = window.setTimeout(() => {
        if (taskId !== playTaskIdRef.current || isPaused) {
          return;
        }

        if (roundIndex + 1 < repeatTimes) {
          void playByRound(roundIndex + 1);
          return;
        }

        if (currentIndex < dictationWords.length - 1) {
          setCurrentIndex((prevState) => Math.min(prevState + 1, dictationWords.length - 1));
          return;
        }

        playCompletionAnnouncement();
      }, Math.max(1, intervalSeconds) * 1000);
    };

    void playByRound(0);

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
    replayNonce,
    repeatTimes,
    setCurrentIndex,
  ]);

  useEffect(() => {
    return () => {
      clearPlayback();
      if (contextRef.current) {
        try {
          void contextRef.current.close();
        } catch {
          // ignore close errors
        }
        contextRef.current = null;
      }
    };
  }, [clearPlayback]);

  return {
    isPreparing,
    playPrepareAnnouncement,
    stopPrepareTask,
    stopPlaybackTask,
    replayCurrent,
  };
};
