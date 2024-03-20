import {ITextToVoice, TextToVoice} from "@client/models/textToVoice/types";
import config from '@client/config.json';

export const textToVoice: TextToVoice = (content: string): ITextToVoice => {
    const utterance = new SpeechSynthesisUtterance(content);
    const {volume, rate, lang} = config.speechSynthesisConfig;

    const voiceList = speechSynthesis.getVoices().filter(item => item.lang === lang);


    utterance.volume = volume;
    utterance.rate = rate;
    utterance.voice = voiceList?.[0];

    return {
        play: () => speechSynthesis.speak(utterance),
        pause: () => speechSynthesis.pause(),
        resume: () => speechSynthesis.resume(),
        onEnd: (callback) => utterance.onend = callback
    }
}