export interface MissingWordPlaceholder {
    id: string;
    options: string[];
    correctOptionIndex: number;
}

export interface MissingWordSentence {
    sentence: string;
    placeholders: MissingWordPlaceholder[];
}

export interface MissingWordData {
    sentences: MissingWordSentence[];
}

export interface AnswerOption {
    id: string;
    option: string | undefined;
    answered: boolean;
}