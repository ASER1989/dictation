import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
    volume?: number;
    lang?: string;
    rate?: number;
    interval?: number;
    repeat?: number;
    contentArray: Array<string>;
}

export default function useSpeak(props: Props) {
    const { interval = 8, repeat = 3 } = props;

    const [contentArray, setContentArray] = useState<Array<string>>(props.contentArray);
    const timerRef = useRef<NodeJS.Timeout>();
    const repeatTimesRef = useRef<number>(0);
    const contentRef = useRef<string>();

    const speak = useCallback((content: string) => {
        return new Promise((resolve) => {
            const { volume = 1, lang, rate = 1 } = props;
            const utterance = new SpeechSynthesisUtterance(content);

            utterance.volume = volume;
            utterance.lang = lang ?? 'en';
            utterance.rate = rate;
            utterance.onend = resolve;
            window.speechSynthesis.speak(utterance);
        });
    }, [props]);

    const next = () => {
        repeatTimesRef.current = 0;
        contentRef.current = contentArray.shift();
    }

    const inovkeSpeak = async () => {
        if (contentRef.current) {
            await speak(contentRef.current);
            repeatTimesRef.current += 1;

            if (repeatTimesRef.current >= repeat) {
                next();
            }

            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(async () => await inovkeSpeak(), interval * 1000);
        }
    }


    const start = (newContent: Array<string>) => {
        if (newContent) {
            setContentArray(newContent);
        }
        next();
        inovkeSpeak();
    }

    const pause = () => {
        clearTimeout(timerRef.current);
    }

    const resume = () => {
        inovkeSpeak();
    }

    return {
        start,
        pause,
        resume
    }
}