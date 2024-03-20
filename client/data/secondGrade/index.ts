import {GetWords} from "../types";
import volume2 from './volume2.json';

export const getWords: GetWords = (gradeSession) => {
    if (gradeSession === 2) {
        return volume2;
    }
    return [];
}