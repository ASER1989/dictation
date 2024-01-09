import React, { useState, useMemo } from "react";
import "./index.styl";
import Button from "@client/components/button";
import Input from "@client/components/input";
import useSpeak from "./useSpeak";
import Words from "@client/components/words";
import Dropdown from "@client/components/dropdown";
import type { DropdownOption } from "@client/components/dropdown";
import type { KeyboardEvent } from "react";
import { FaRegPaperPlane } from "react-icons/fa6";
import testData from './test.json';

export default function App() {

  const voiceList = speechSynthesis.getVoices().filter(item => item.lang === "zh-CN");

  const [contentArray, setContentArray] = useState<Array<string>>(testData);
  const [wordsInput, setWordsInput] = useState<string>();
  const [dictationState, setDictationState] = useState<string | null>(null);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice>(voiceList[0]);


  const speak = useSpeak({
    interval: 3,
    contentArray,
    voice: currentVoice
  });

  const getVoiceOptions = () => voiceList.map(item => ({
    value: item.voiceURI,
    label: item.name
  }))

  const handleStart = () => {
    setDictationState("running");
    speak.start(contentArray);
  };

  const handlePause = () => {
    setDictationState("pause");
    speak.pause();
  };

  const handleResume = () => {
    setDictationState("running");
    speak.resume();
  };

  const handleNext = () => {
    speak.next();
  }

  const handleWordsRemove = (removeIndex: number) => {
    setContentArray((ownState) => {
      ownState.splice(removeIndex, 1);
      return [...ownState];
    });
  };

  const handleNewWordsChange = (newValue: string) => {
    setWordsInput(newValue);
  };

  const handleWordsAdd = () => {
    if (wordsInput) {
      setContentArray((ownState) => {
        ownState.push(wordsInput.replace(/\n/g, ""));
        return [...ownState];
      });
      setWordsInput("");
    }
  };
  const handleWordsEnterDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.code === "Enter") {
      handleWordsAdd();
    }
  };

  const handleVoiceChange = (voiceOption: DropdownOption) => {
    const voice = voiceList.find(item => item.voiceURI === voiceOption.value);
    if (voice) {
      setCurrentVoice(voice);
    }
  }

  return (
    <div className="app">
      <div className="words-list">
        {contentArray.map((item, idx) => {
          return <Words onRemove={() => handleWordsRemove(idx)}>{item}</Words>;
        })}
      </div>
      <div className="footer">
        <div className="input-container">
          <Input
            value={wordsInput}
            onKeyDown={handleWordsEnterDown}
            onChange={handleNewWordsChange}
            placeholder="输入听写内容，可以通过Enter键提交"
          />
          <FaRegPaperPlane className="words-submit" onClick={handleWordsAdd} />
        </div>
        <div className="footer-options">
          <Dropdown options={getVoiceOptions()} onChange={handleVoiceChange}></Dropdown>
        </div>
        <div className="button-list">
          {dictationState === null && (
            <Button type="primary" onClick={handleStart}>
              开始听写
            </Button>
          )}
          {dictationState === "running" && (
            <div className="button-group">
              <Button onClick={handlePause}>暂停</Button>
              <Button onClick={handleNext} type="primary">继续</Button>
            </div>
          )}
          {dictationState === "pause" && (
            <Button type="primary" onClick={handleResume}>
              继续
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
