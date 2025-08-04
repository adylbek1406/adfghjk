import { translations } from './translations';

export type TranslationKey = keyof typeof translations.ru;

export type TranslationFunction = (key: TranslationKey) => string; 