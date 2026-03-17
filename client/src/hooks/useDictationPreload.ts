import { useCallback, useEffect, useRef } from "react";
import type { DictationWordItem } from "@client/types/vocabulary";
import { getAudioContextCtor } from "./audioContext";

const PRELOAD_GROUP_SIZE = 5;
const PRELOAD_AHEAD_GROUPS = 2;
const PRELOAD_TIMEOUT_MS = 8000;

export type DictationPreloadOptions = {
  dictationWords: DictationWordItem[];
  currentIndex: number;
  loading: boolean;
};

export type DictationPreloadHandle = {
  resetPreload: () => void;
};

export const useDictationPreload = ({
  dictationWords,
  currentIndex,
  loading,
}: DictationPreloadOptions): DictationPreloadHandle => {
  const preloadTaskIdRef = useRef(0);
  const preloadCursorRef = useRef(0);
  const preloadTargetGroupRef = useRef(0);
  const preloadRunningRef = useRef(false);
  const preloadContextRef = useRef<AudioContext | null>(null);
  const preloadControllersRef = useRef<Set<AbortController>>(new Set());
  const preloadedUrlsRef = useRef<Set<string>>(new Set());

  const stopPreloadTask = useCallback(() => {
    preloadTaskIdRef.current += 1;
    preloadCursorRef.current = 0;
    preloadTargetGroupRef.current = 0;
    preloadRunningRef.current = false;
    preloadedUrlsRef.current.clear();
    for (const controller of preloadControllersRef.current) {
      controller.abort();
    }
    preloadControllersRef.current.clear();
    if (preloadContextRef.current) {
      try {
        void preloadContextRef.current.close();
      } catch {
        // ignore close errors
      }
      preloadContextRef.current = null;
    }
  }, []);

  const preloadAudio = useCallback((url: string, taskId: number) => {
    return new Promise<void>((resolve) => {
      if (taskId !== preloadTaskIdRef.current) {
        resolve();
        return;
      }

      if (typeof window === "undefined") {
        resolve();
        return;
      }

      const AudioContextCtor = getAudioContextCtor();
      if (!AudioContextCtor) {
        resolve();
        return;
      }

      if (!preloadContextRef.current || preloadContextRef.current.state === "closed") {
        preloadContextRef.current = new AudioContextCtor();
      }

      const context = preloadContextRef.current;
      if (!context) {
        resolve();
        return;
      }

      const controller = new AbortController();
      preloadControllersRef.current.add(controller);

      let settled = false;
      const done = () => {
        if (settled) {
          return;
        }
        settled = true;
        window.clearTimeout(timeoutId);
        preloadControllersRef.current.delete(controller);
        resolve();
      };

      const timeoutId = window.setTimeout(() => {
        controller.abort();
        done();
      }, PRELOAD_TIMEOUT_MS);

      const run = async () => {
        try {
          const response = await fetch(url, {
            signal: controller.signal,
            cache: "force-cache",
          });
          const buffer = await response.arrayBuffer();
          if (taskId !== preloadTaskIdRef.current) {
            done();
            return;
          }
          await context.decodeAudioData(buffer);
        } catch {
          // ignore preload errors
        } finally {
          done();
        }
      };

      void run();
    });
  }, []);

  const preloadAudioGroup = useCallback(
    async (urls: string[], taskId: number) => {
      const uniqueUrls = Array.from(new Set(urls)).filter(
        (url) => !preloadedUrlsRef.current.has(url),
      );

      if (uniqueUrls.length === 0) {
        return;
      }

      for (const url of uniqueUrls) {
        if (taskId !== preloadTaskIdRef.current) {
          return;
        }
        // Preload sequentially to keep memory usage stable.
        await preloadAudio(url, taskId);
      }

      if (taskId === preloadTaskIdRef.current) {
        uniqueUrls.forEach((url) => {
          preloadedUrlsRef.current.add(url);
        });
      }
    },
    [preloadAudio],
  );

  const startPreloadLoop = useCallback(() => {
    if (preloadRunningRef.current || dictationWords.length === 0) {
      return;
    }

    const taskId = preloadTaskIdRef.current;
    preloadRunningRef.current = true;

    const run = async () => {
      while (taskId === preloadTaskIdRef.current) {
        const targetGroup = preloadTargetGroupRef.current;
        if (preloadCursorRef.current > targetGroup) {
          break;
        }

        const groupIndex = preloadCursorRef.current;
        const start = groupIndex * PRELOAD_GROUP_SIZE;
        const end = Math.min(start + PRELOAD_GROUP_SIZE, dictationWords.length);
        const urls = dictationWords.slice(start, end).map((item) => item.audioUrl);
        if (urls.length === 0) {
          preloadCursorRef.current += 1;
          continue;
        }

        await preloadAudioGroup(urls, taskId);
        preloadCursorRef.current += 1;
      }

      preloadRunningRef.current = false;

      if (
        taskId === preloadTaskIdRef.current &&
        preloadCursorRef.current <= preloadTargetGroupRef.current
      ) {
        startPreloadLoop();
      }
    };

    void run();
  }, [dictationWords, preloadAudioGroup]);

  useEffect(() => {
    if (loading || dictationWords.length === 0) {
      return;
    }

    if (typeof window === "undefined" || !getAudioContextCtor()) {
      return;
    }

    const groupCount = Math.ceil(dictationWords.length / PRELOAD_GROUP_SIZE);
    const currentGroup = Math.floor(currentIndex / PRELOAD_GROUP_SIZE);
    const targetGroup = Math.min(
      currentGroup + PRELOAD_AHEAD_GROUPS,
      Math.max(groupCount - 1, 0),
    );
    preloadTargetGroupRef.current = targetGroup;

    startPreloadLoop();
  }, [currentIndex, dictationWords.length, loading, startPreloadLoop]);

  useEffect(() => {
    return () => {
      stopPreloadTask();
    };
  }, [stopPreloadTask]);

  return { resetPreload: stopPreloadTask };
};
