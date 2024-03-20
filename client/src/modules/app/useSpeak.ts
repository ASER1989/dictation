import {useRef, useState} from "react";
import {textToVoice} from "@client/models/textToVoice/baiduVoice";
import {ITextToVoice} from "@client/models/textToVoice/types";

type Props = {
    interval?: number;
    repeat?: number;
    contentArray: Array<string>;
};

export default function useSpeak(props: Props) {
    const {interval = 5, repeat = 5} = props;

    const [contentArray, setContentArray] = useState<Array<string>>(
        props.contentArray,
    );
    const timerRef = useRef<NodeJS.Timeout>();
    const repeatTimesRef = useRef<number>(0);
    const contentRef = useRef<string>();
    const indexRef = useRef<number>(0);

    const voiceObjectRef = useRef<ITextToVoice>();

    const handleSpeechEnd = async () => {
        const voiceObject = await textToVoice('');
        voiceObject.play();
    }

    const getWords = () => {
        if (contentArray.length < indexRef.current) {
            handleSpeechEnd();
        }
        contentRef.current = contentArray[indexRef.current];
        indexRef.current += 1;
    }


    const handleVoicePlayEnd = () => {
        repeatTimesRef.current += 1;
        if (repeatTimesRef.current >= repeat) {
            repeatTimesRef.current = 0;
            voiceObjectRef.current = undefined;
            getWords();
        }
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(
            async () => await speech(),
            interval * 1000,
        );
    }
    const speech = async () => {
        if (contentRef.current) {
            if (!voiceObjectRef.current) {
                voiceObjectRef.current = await textToVoice(contentRef.current);
                voiceObjectRef.current.onEnd(handleVoicePlayEnd);
            }
            voiceObjectRef.current.play();
        }
    }

    const start = (newContent?: Array<string>) => {
        if (newContent) {
            setContentArray(newContent);
            indexRef.current = 0;
        }
        getWords();
        speech();
    };

    const pause = () => {
        voiceObjectRef.current?.pause();
    };

    const resume = () => {
        voiceObjectRef.current?.play();
    };

    const next = () => {
        voiceObjectRef.current = undefined;
        start()
    };

    return {
        start,
        pause,
        resume,
        next
    };
}
