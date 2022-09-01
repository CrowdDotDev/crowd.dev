import _get from 'lodash/get'
import moment from 'moment'
import { setLocale as setYupLocale } from 'yup'
import momentLocaleEs from 'moment/locale/es'
import momentLocalePt from 'moment/locale/pt'

import elementPlusEs from 'element-plus/lib/locale/lang/es'
import elementPlusEn from 'element-plus/lib/locale/lang/en'
import elementPlusPt from 'element-plus/lib/locale/lang/pt'

import i18nEs from '@/i18n/es'
import i18nEn from '@/i18n/en'
import i18nPt from '@/i18n/pt-BR'

let currentLanguageCode = ''

const languages = {
  en: {
    id: 'en',
    label: 'English',
    flag: '/images/flags/United-States.png',
    elementUI: null,
    dictionary: null
  },
  es: {
    id: 'es',
    label: 'Español',
    flag: '/images/flags/Spain.png',
    elementUI: null,
    dictionary: null
  },
  'pt-BR': {
    id: 'pt-BR',
    label: 'Português',
    flag: '/images/flags/Brazil.png',
    elementUI: null,
    dictionary: null
  }
}

export function init() {
  currentLanguageCode =
    localStorage.getItem('language') || 'en'
  setLanguageCode(currentLanguageCode)

  if (currentLanguageCode === 'en') {
    initEn()
  }

  if (currentLanguageCode === 'pt-BR') {
    initPt()
  }

  if (currentLanguageCode === 'es') {
    initEs()
  }
}

function initEs() {
  const language = languages['es']

  const momentLocale = momentLocaleEs

  language.elementUI = elementPlusEs

  language.dictionary = i18nEs

  moment.locale('es', momentLocale)

  if (language.dictionary.validation) {
    setYupLocale(language.dictionary.validation)
  }

  return language
}

function initPt() {
  const language = languages['pt']

  const momentLocale = momentLocalePt

  language.elementUI = elementPlusPt

  language.dictionary = i18nPt

  moment.locale('pt', momentLocale)

  if (language.dictionary.validation) {
    setYupLocale(language.dictionary.validation)
  }

  return language
}

export function initEn() {
  const language = languages['en']

  language.elementUI = elementPlusEn

  language.dictionary = i18nEn

  moment.locale('en')

  if (language.dictionary.validation) {
    setYupLocale(language.dictionary.validation)
  }

  return language
}

function getLanguage() {
  return languages[getLanguageCode()]
}

function format(message, args) {
  if (!message) {
    return null
  }

  try {
    return message.replace(
      /{(\d+)}/g,
      function (match, number) {
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
      }
    )
  } catch (error) {
    console.error(message, error)
    throw error
  }
}

export function getLanguages() {
  return Object.keys(languages).map((language) => {
    return languages[language]
  })
}

export function getElementUILanguage() {
  return getLanguage().elementUI
}

export function getLanguageCode() {
  return currentLanguageCode
}

export function setLanguageCode(arg) {
  if (!languages[arg]) {
    throw new Error(`Invalid language ${arg}.`)
  }

  localStorage.setItem('language', arg)
}

export function i18nExists(key) {
  if (!getLanguage()) {
    return false
  }

  const message = _get(getLanguage().dictionary, key)
  return Boolean(message)
}

export function i18n(key, ...args) {
  if (!getLanguage()) {
    return key
  }

  const message = _get(getLanguage().dictionary, key)

  if (!message) {
    return key
  }

  return format(message, args)
}
