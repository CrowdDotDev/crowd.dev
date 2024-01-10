import _get from 'lodash.get'
import en from './en'
import ptBR from './pt-BR'
import es from './es'

/**
 * Object with the languages available.
 */
const languages = {
  en,
  'pt-BR': ptBR,
  es,
}

/**
 * Replaces the parameters of a message with the args.
 */
function format(message, args) {
  if (!message) {
    return null
  }

  return message.replace(/{(\d+)}/g, (match, number) =>
    typeof args[number] !== 'undefined' ? args[number] : match,
  )
}

/**
 * Checks if the key exists on the language.
 */
export const i18nExists = (languageCode, key) => {
  const dictionary = languages[languageCode] || languages.en
  const message = _get(dictionary, key)
  return Boolean(message)
}

/**
 * Returns the translation based on the key.
 */
export const i18n = (languageCode, key, ...args) => {
  const dictionary = languages[languageCode] || languages.en
  const message = _get(dictionary, key)

  if (!message) {
    return key
  }

  return format(message, args)
}
