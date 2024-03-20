import config from '@client/config.json';
import {ITextToVoice, TextToVoice} from "@client/models/textToVoice/types";

export type RequestParams = {
    tex: string;
    tok: string;
    cuid: string;
    ctp: string;
    lan: string;
    spd?: number;
    pit?: number;
    vol?: number;
    per?: number;
    aue?: number;
    [key: string]: string | number | undefined;
}

const paramObjToString = (params: RequestParams) => {
    const paramsArray: Array<string> = [];
    Object.keys(params).forEach(key => {
        paramsArray.push(`${key}=${params[key]}`);
    })
    return paramsArray.join('&');
}

export const textToVoice:TextToVoice = async (content: string): Promise<ITextToVoice> => {
    const {baiduConfig} = config;
    const requestParams: RequestParams = {
        tex: encodeURIComponent(content),
        ...baiduConfig.params
    };

    const result: any = await fetch(baiduConfig.requestUri, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: paramObjToString(requestParams)
    });

    let audio: HTMLAudioElement | undefined;

    const audioBlob = await result?.blob?.();
    if (audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        audio = new Audio(audioUrl);
    }

    return {
        play: () => audio?.play(),
        pause: () => audio?.pause(),
        resume: () => audio?.play(),
        onEnd: (callback) => {
            if (audio) {
                audio.onended = callback
            }
        }
    }
}