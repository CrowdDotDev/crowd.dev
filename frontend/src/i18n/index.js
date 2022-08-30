import _get from 'lodash/get'
import moment from 'moment'
import { setLocale as setYupLocale } from 'yup'

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

export async function init() {
  currentLanguageCode =
    localStorage.getItem('language') || 'en'
  setLanguageCode(currentLanguageCode)

  if (currentLanguageCode === 'en') {
    await initEn()
  }

  if (currentLanguageCode === 'pt-BR') {
    await initPtBr()
  }

  if (currentLanguageCode === 'es') {
    await initEs()
  }
}

async function initEs() {
  const language = languages['es']

  const momentLocale = (await import('moment/locale/es'))
    .default

  language.elementUI = (
    await import('element-plus/lib/locale/lang/es')
  ).default

  language.dictionary = (await import('@/i18n/es')).default

  moment.locale('es', momentLocale)

  if (language.dictionary.validation) {
    setYupLocale(language.dictionary.validation)
  }

  return language
}

async function initPtBr() {
  const language = languages['pt-BR']

  const momentLocale = (await import('moment/locale/pt-br'))
    .default

  language.elementUI = (
    await import('element-plus/lib/locale/lang/pt-br')
  ).default

  language.dictionary = (
    await import('@/i18n/pt-BR')
  ).default

  moment.locale('pt-BR', momentLocale)

  if (language.dictionary.validation) {
    setYupLocale(language.dictionary.validation)
  }

  return language
}

async function initEn() {
  const language = languages['en']

  language.dictionary = (await import('@/i18n/en')).default

  language.elementUI = (
    await import('element-plus/lib/locale/lang/en')
  ).default

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
