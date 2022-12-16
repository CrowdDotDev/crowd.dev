import { i18n, i18nExists } from '@/i18n'
import { router } from '@/router'
import Message from '@/shared/message/message'
import { AuthService } from '@/modules/auth/auth-service'

const DEFAULT_ERROR_MESSAGE = i18n(
  'errors.defaultErrorMessage'
)

function selectErrorKeyOrMessage(error) {
  if (error && error.response && error.response.data) {
    const data = error.response.data

    if (data.error && data.error.message) {
      return data.error.message
    }

    return String(data)
  }

  return error.message || DEFAULT_ERROR_MESSAGE
}

function selectErrorMessage(error) {
  const key = selectErrorKeyOrMessage(error)

  if (i18nExists(key)) {
    return i18n(key)
  }

  return key
}

function selectErrorCode(error) {
  if (error && error.response && error.response.status) {
    return error.response.status
  }

  return 500
}

export default class Errors {
  static handle(error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(selectErrorMessage(error))
      console.error(error)
    }

    if (selectErrorCode(error) === 401) {
      AuthService.signout()
      window.location.reload()
      return
    }

    if (selectErrorCode(error) === 403) {
      if (error.config.url.includes('member/export')) {
        // we'll be handling these differently
        return
      }

      if (
        error.response.data.includes('Missing scopes in ')
      ) {
        Message.error(error.response.data, { duration: 0 })
        return
      }
      return router.push('/403')
    }

    if ([400, 409, 429].includes(selectErrorCode(error))) {
      Message.error(selectErrorMessage(error))
      return
    }

    if (selectErrorCode(error) === 542) {
      Message.error(
        'An error has occurred setting up the integration, please reach out to us via chat, or via email (help@crowd.dev)',
        { duration: 0 }
      )
      return
    }

    router.push('/500')
  }

  static errorCode(error) {
    return selectErrorCode(error)
  }

  static selectMessage(error) {
    return selectErrorMessage(error)
  }

  static showMessage(error) {
    Message.error(selectErrorMessage(error))
  }
}
