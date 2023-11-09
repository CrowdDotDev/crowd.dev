import { i18n, i18nExists } from '../i18n'

export default class Error403 extends Error {
  code: number

  constructor(language?, messageCode?, params?) {
    let message

    if (messageCode && i18nExists(language, messageCode)) {
      message = i18n(language, messageCode)
    }

    message = message || i18n(language, 'errors.forbidden.message')

    if (params && params.integration && params.scopes) {
      if (typeof params.scopes === 'string') {
        params.scopes = [params.scopes.join(', ')]
      }
      message = message.replace('{integration}', params.integration)
      message = message.replace('{scopes}', params.scopes)
    }

    super(message)
    this.code = 403
  }
}
