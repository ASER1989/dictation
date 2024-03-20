export interface ITextToVoice {
    play: () => void;
    pause: () => void;
    resume: () => void;
    onEnd: (callback: () => void) => void;
}

export type TextToVoice = (content: string) => ITextToVoice | Promise<ITextToVoice>;