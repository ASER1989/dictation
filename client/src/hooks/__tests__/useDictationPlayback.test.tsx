import { act, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { useDictationPlayback } from "../useDictationPlayback";
import { installMockAudioContext } from "../../test/utils/audioContext";

describe("useDictationPlayback", () => {
  it("advances index after audio playback completes", async () => {
    vi.useFakeTimers();

    try {
      const fetchMock = vi.fn(async () => ({
        arrayBuffer: async () => new ArrayBuffer(8),
      }));
      vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

      installMockAudioContext();

      const dictationWords = [
        { word: "alpha", audioUrl: "/audio/alpha" },
        { word: "beta", audioUrl: "/audio/beta" },
      ];

      const { result } = renderHook(() => {
        const [currentIndex, setCurrentIndex] = useState(0);
        const [isPaused] = useState(false);
        const playback = useDictationPlayback({
          dictationWords,
          repeatTimes: 1,
          intervalSeconds: 1,
          loading: false,
          currentIndex,
          isPaused,
          setCurrentIndex,
        });

        return { currentIndex, ...playback };
      });

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.currentIndex).toBe(1);
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
