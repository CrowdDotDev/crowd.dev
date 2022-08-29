import { i18n } from '@/i18n'
import { ElNotification } from 'element-plus'

export default class Message {
  static success(payload, options = {}) {
    ElNotification(
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

    ElNotification(
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
