import { vi } from "vitest";

type MockAudioBufferSourceNode = {
  buffer: AudioBuffer | null;
  onended: (() => void) | null;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
};

type MockAudioContextInstance = {
  state: AudioContextState;
  destination: AudioDestinationNode | Record<string, never>;
  decodeAudioData: ReturnType<typeof vi.fn>;
  createBufferSource: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
};

export const installMockAudioContext = () => {
  const contexts: MockAudioContextInstance[] = [];

  class MockAudioBufferSource implements MockAudioBufferSourceNode {
    buffer: AudioBuffer | null = null;
    onended: (() => void) | null = null;
    connect = vi.fn();
    disconnect = vi.fn();
    start = vi.fn(() => {
      window.setTimeout(() => {
        this.onended?.();
      }, 0);
    });
    stop = vi.fn();
  }

  class MockAudioContext implements MockAudioContextInstance {
    state: AudioContextState = "running";
    destination: AudioDestinationNode | Record<string, never> = {};
    decodeAudioData = vi.fn(async () => ({} as AudioBuffer));
    createBufferSource = vi.fn(() => new MockAudioBufferSource());
    close = vi.fn(async () => {
      this.state = "closed";
    });
    resume = vi.fn(async () => {
      this.state = "running";
    });

    constructor() {
      contexts.push(this);
    }
  }

  window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

  return { contexts, MockAudioContext, MockAudioBufferSource };
};

export type { MockAudioContextInstance };
