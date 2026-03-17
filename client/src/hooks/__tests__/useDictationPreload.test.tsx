import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDictationPreload } from "../useDictationPreload";
import { installMockAudioContext } from "../../test/utils/audioContext";

describe("useDictationPreload", () => {
  it("preloads audio groups and resets resources", async () => {
    const fetchMock = vi.fn(async () => ({
      arrayBuffer: async () => new ArrayBuffer(8),
    }));
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const { contexts } = installMockAudioContext();

    const dictationWords = [
      { word: "alpha", audioUrl: "/audio/alpha" },
      { word: "beta", audioUrl: "/audio/beta" },
    ];

    const { result } = renderHook(() =>
      useDictationPreload({ dictationWords, currentIndex: 0, loading: false }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(dictationWords.length);
    });

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual(
      expect.arrayContaining(dictationWords.map((item) => item.audioUrl)),
    );

    result.current.resetPreload();

    expect(contexts.length).toBeGreaterThan(0);
    expect(contexts[0].close).toHaveBeenCalled();
  });
});
