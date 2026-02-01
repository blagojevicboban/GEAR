import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import srTranslation from './locales/sr/translation.json';
import itTranslation from './locales/it/translation.json';
import elTranslation from './locales/el/translation.json';
import ptTranslation from './locales/pt/translation.json';
import trTranslation from './locales/tr/translation.json';

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: enTranslation,
            },
            sr: {
                translation: srTranslation,
            },
            it: {
                translation: itTranslation,
            },
            el: {
                translation: elTranslation,
            },
            pt: {
                translation: ptTranslation,
            },
            tr: {
                translation: trTranslation,
            },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already safes from xss
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
