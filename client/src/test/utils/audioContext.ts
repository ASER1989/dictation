import { vi } from "vitest";

type MockAudioBufferSourceNode = {
  buffer: AudioBuffer | null;
  onended: (() => void) | null;
  connect: (...args: unknown[]) => void;
  disconnect: (...args: unknown[]) => void;
  start: (...args: unknown[]) => void;
  stop: (...args: unknown[]) => void;
};

type MockAudioContextInstance = {
  state: AudioContextState;
  destination: AudioDestinationNode | Record<string, never>;
  decodeAudioData: (...args: unknown[]) => Promise<AudioBuffer>;
  createBufferSource: (...args: unknown[]) => MockAudioBufferSourceNode;
  close: (...args: unknown[]) => Promise<void>;
  resume: (...args: unknown[]) => Promise<void>;
};

export const installMockAudioContext = () => {
  const contexts: MockAudioContextInstance[] = [];

  class MockAudioBufferSource implements MockAudioBufferSourceNode {
    buffer: AudioBuffer | null = null;
    onended: (() => void) | null = null;
    connect = vi.fn() as unknown as MockAudioBufferSourceNode["connect"];
    disconnect = vi.fn() as unknown as MockAudioBufferSourceNode["disconnect"];
    start = vi.fn(() => {
      window.setTimeout(() => {
        this.onended?.();
      }, 0);
    }) as unknown as MockAudioBufferSourceNode["start"];
    stop = vi.fn() as unknown as MockAudioBufferSourceNode["stop"];
  }

  class MockAudioContext implements MockAudioContextInstance {
    state: AudioContextState = "running";
    destination: AudioDestinationNode | Record<string, never> = {};
    decodeAudioData = vi.fn(async () => ({} as AudioBuffer)) as unknown as MockAudioContextInstance["decodeAudioData"];
    createBufferSource = vi.fn(() => new MockAudioBufferSource()) as unknown as MockAudioContextInstance["createBufferSource"];
    close = vi.fn(async () => {
      this.state = "closed";
    }) as unknown as MockAudioContextInstance["close"];
    resume = vi.fn(async () => {
      this.state = "running";
    }) as unknown as MockAudioContextInstance["resume"];

    constructor() {
      contexts.push(this);
    }
  }

  window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

  return { contexts, MockAudioContext, MockAudioBufferSource };
};

export type { MockAudioContextInstance };
