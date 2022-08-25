import { i18n } from '@/i18n'
import { Notification } from 'element-ui'

export default class Message {
  static success(payload, options = {}) {
    Notification(
      Object.assign(
        {},
        {
          title: '',
          showClose: true,
          message: payload,
          type: 'success',
          duration: 6000,
          dangerouslyUseHTMLString: true,
          position: 'top-right',
          offset: 64
        },
        options
      )
    )
  }

  static error(payload, options = {}) {
    let message = payload

    if (!message) {
      message = i18n('errors.defaultErrorMessage')
    }

    Notification(
      Object.assign(
        {},
        {
          title: '',
          showClose: true,
          message,
          type: 'error',
          //duration: 6000,
          dangerouslyUseHTMLString: true,
          position: 'top-right',
          offset: 64
        },
        options
      )
    )
  }
}
