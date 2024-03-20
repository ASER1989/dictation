export type GradeSession = 1 | 2;
export type DictationItem = {
    word: string;
    example?: string;
}
export type GetWords = (gradeSession: GradeSession) => Array<DictationItem>;