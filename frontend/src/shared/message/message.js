import { i18n } from '@/i18n'
import { ElNotification } from 'element-plus'

import { h } from 'vue'

const successIcon = h(
  'i', // type
  { class: 'ri-checkbox-circle-fill text-green-500' }, // props
  []
)

const errorIcon = h(
  'i', // type
  { class: 'ri-error-warning-fill text-red-500' }, // props
  []
)

export default class Message {
  static success(message, options = {}) {
    ElNotification(
      Object.assign(
        {},
        {
          title: options.title ? options.title : message,
          showClose: true,
          message: options.title ? message : null,
          customClass: 'success',
          icon: successIcon,
          duration: 6000,
          dangerouslyUseHTMLString: true,
          position: 'bottom-right',
          offset: 24
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
          title: options.title ? options.title : message,
          showClose: true,
          message: options.title ? message : null,
          customClass: 'error',
          icon: errorIcon,
          duration: 0,
          dangerouslyUseHTMLString: true,
          position: 'bottom-right',
          offset: 24
        },
        options
      )
    )
  }
}
