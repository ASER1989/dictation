import React, { useState } from 'react';
import './index.styl';
import Button from '@client/components/button';
import Textarea from '@client/components/textarea';
import useSpeak from './useSpeak';
import Words from '@client/components/words';
import type { KeyboardEvent } from 'react';

export default function App() {

    const [contentArray, setContentArray] = useState<Array<string>>([]);
    const [wordsInput, setWordsInput] = useState<string>();

    const speak = useSpeak({
        interval: 3,
        contentArray
    });

    const handleStart = () => {
        speak.start(contentArray);
    }

    const handlePause = () => {
        speak.pause();
    }

    const handleResume = () => {
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

    const handleWordsAdd = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.code === "Enter" && wordsInput) {
            setContentArray((ownState) => {
                ownState.push(wordsInput.replace(/\n/g, ''));
                return [...ownState];
            });
            setWordsInput("");
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
            <div>
                <Textarea value={wordsInput} onKeyDown={handleWordsAdd} onChange={handleNewWordsChange}></Textarea>
            </div>
            <div>
                <Button type='primary' onClick={handleStart}>开始听写</Button>
                <Button onClick={handlePause}>暂停</Button>
                <Button type='primary' onClick={handleResume}>继续</Button>
            </div>
        </div>
    )
}