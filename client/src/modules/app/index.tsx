import React, { useState } from 'react';
import './index.styl';
import Button from '@client/components/button';
import Input from '@client/components/input';
import useSpeak from './useSpeak';
import Words from '@client/components/words';
import type { KeyboardEvent } from 'react';
import { FaRegPaperPlane } from "react-icons/fa6";

export default function App() {

    const [contentArray, setContentArray] = useState<Array<string>>([]);
    const [wordsInput, setWordsInput] = useState<string>();
    const [dictationState, setDictationState] = useState<string | null>(null);

    const speak = useSpeak({
        interval: 3,
        contentArray
    });

    const handleStart = () => {
        setDictationState('running');
        speak.start(contentArray);
    }

    const handlePause = () => {
        setDictationState('pause');
        speak.pause();
    }

    const handleResume = () => {
        setDictationState('running');
        speak.resume();
    }


    const handleWordsRemove = (removeIndex: number) => {
        setContentArray((ownState) => {
            ownState.splice(removeIndex, 1);
            return [...ownState];
        });
    }

    const handleNewWordsChange = (newValue: string) => {
        setWordsInput(newValue);
    }


    const handleWordsAdd = () => {
        if (wordsInput) {
            setContentArray((ownState) => {
                ownState.push(wordsInput.replace(/\n/g, ''));
                return [...ownState];
            });
            setWordsInput("");
        }
    }
    const handleWordsEnterDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.code === "Enter") {
            handleWordsAdd()
        }
    }

    return (
        <div className='app'>
            <div className='words-list'>
                {
                    contentArray.map((item, idx) => {
                        return <Words onRemove={() => handleWordsRemove(idx)}>{item}</Words>
                    })
                }
            </div>
            <div className='footer'>
                <div className='input-container'>
                    <Input value={wordsInput} onKeyDown={handleWordsAdd} onChange={handleNewWordsChange} placeholder='输入听写内容，可以通过Enter键提交' />
                    <FaRegPaperPlane className='words-submit' onClick={handleWordsAdd} />
                </div>
                <div className='button-list'>
                    {dictationState === null && <Button type='primary' onClick={handleStart}>开始听写</Button>}
                    {dictationState === 'running' && <Button onClick={handlePause}>暂停</Button>}
                    {dictationState === 'pause' && <Button type='primary' onClick={handleResume}>继续</Button>}
                </div>
            </div>
        </div>
    )
}