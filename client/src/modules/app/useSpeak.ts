import { useCallback, useRef, useState, useEffect } from "react";

type Props = {
  volume?: number;
  lang?: string;
  rate?: number;
  interval?: number;
  repeat?: number;
  contentArray: Array<string>;
  voice: SpeechSynthesisVoice;
};

export default function useSpeak(props: Props) {
  const { interval = 6, repeat = 4, volume = 1, voice, rate = 0.6 } = props;

  const [contentArray, setContentArray] = useState<Array<string>>(
    props.contentArray,
  );
  const timerRef = useRef<NodeJS.Timeout>();
  const repeatTimesRef = useRef<number>(0);
  const contentRef = useRef<string>();
  const indexRef = useRef<number>(0);

  const speak = useCallback(
    (content: string) => {
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(content);


        utterance.volume = volume;
        utterance.rate = rate;
        utterance.voice = voice;
        utterance.onend = resolve;

        speechSynthesis.speak(utterance);
      });
    },
    [volume, voice, rate],
  );



  const getWords = () => {
    repeatTimesRef.current = 0;
    contentRef.current = contentArray[indexRef.current];
    indexRef.current += 1;
  }

  const inovkeSpeak = async () => {
    if (contentRef.current) {
      await speak(contentRef.current);
      repeatTimesRef.current += 1;

      if (repeatTimesRef.current >= repeat) {
        getWords();
      }

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(
        async () => await inovkeSpeak(),
        interval * 1000,
      );
    }
  };

  const start = (newContent?: Array<string>) => {
    if (newContent) {
      setContentArray(newContent);
      indexRef.current = 0;
    }
    getWords();
    inovkeSpeak();
  };

  const pause = () => {
    clearTimeout(timerRef.current);
  };

  const resume = () => {
    inovkeSpeak();
  };

  const next = () => {
    start()
  };

  return {
    start,
    pause,
    resume,
    next
  };
}
