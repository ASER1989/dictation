export type AudioContextCtor = typeof AudioContext;

type WindowWithWebkitAudioContext = Window & {
  webkitAudioContext?: AudioContextCtor;
};

export const getAudioContextCtor = (): AudioContextCtor | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.AudioContext || (window as WindowWithWebkitAudioContext).webkitAudioContext || null;
};
