import _get from 'lodash/get';
import { setLocale as setYupLocale } from 'yup';

import i18nEs from '@/i18n/es';
import i18nEn from '@/i18n/en';
import i18nPt from '@/i18n/pt-BR';

let currentLanguageCode = '';

const languages = {
  en: {
    id: 'en',
    label: 'English',
    flag: '/images/flags/United-States.png',
    elementUI: null,
    dictionary: null,
  },
  es: {
    id: 'es',
    label: 'Español',
    flag: '/images/flags/Spain.png',
    elementUI: null,
    dictionary: null,
  },
  'pt-BR': {
    id: 'pt-BR',
    label: 'Português',
    flag: '/images/flags/Brazil.png',
    elementUI: null,
    dictionary: null,
  },
};

function initEs() {
  const language = languages.es;

  language.dictionary = i18nEs;

  if (language.dictionary.validation) {
    setYupLocale(language.dictionary.validation);
  }

  return language;
}

function initPt() {
  const language = languages.pt;

  language.dictionary = i18nPt;

  if (language.dictionary.validation) {
    setYupLocale(language.dictionary.validation);
  }

  return language;
}

export function initEn() {
  const language = languages.en;

  language.dictionary = i18nEn;

  if (language.dictionary.validation) {
    setYupLocale(language.dictionary.validation);
  }

  return language;
}

export function getLanguageCode() {
  return currentLanguageCode;
}

function getLanguage() {
  return languages[getLanguageCode()];
}

function format(message, args) {
  if (!message) {
    return null;
  }

  try {
    return message.replace(
      /{(\d+)}/g,
      (match, number) => (typeof args[number] !== 'undefined'
        ? args[number]
        : match),
    );
  } catch (error) {
    console.error(message, error);
    throw error;
  }
}

export function getLanguages() {
  return Object.keys(languages).map((language) => languages[language]);
}

export function getElementUILanguage() {
  return getLanguage().elementUI;
}

export function setLanguageCode(arg) {
  if (!languages[arg]) {
    throw new Error(`Invalid language ${arg}.`);
  }

  localStorage.setItem('language', arg);
}

export function i18nExists(key) {
  if (!getLanguage()) {
    return false;
  }

  const message = _get(getLanguage().dictionary, key);
  return Boolean(message);
}

export function i18n(key, ...args) {
  if (!getLanguage()) {
    return key;
  }

  const message = _get(getLanguage().dictionary, key);

  if (!message) {
    return key;
  }

  return format(message, args);
}

export function init() {
  currentLanguageCode = localStorage.getItem('language') || 'en';
  setLanguageCode(currentLanguageCode);

  if (currentLanguageCode === 'en') {
    initEn();
  }

  if (currentLanguageCode === 'pt-BR') {
    initPt();
  }

  if (currentLanguageCode === 'es') {
    initEs();
  }
}
