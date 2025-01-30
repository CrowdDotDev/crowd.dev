import { ElNotification } from 'element-plus';
import 'element-plus/es/components/notification/style/css';

import { h } from 'vue';

const successIcon = h(
  'i', // type
  { class: 'fa-circle-check fa-light text-green-500' }, // props
  [],
);

const errorIcon = h(
  'i', // type
  { class: 'fa-circle-exclamation fa-light text-red-500' }, // props
  [],
);

const infoIcon = h(
  'i', // type
  { class: 'fa-circle-notch fa-light text-primary-600 animate-spin' }, // props
  [],
);

export default class Message {
  static success(message, options = {}) {
    ElNotification(
      {

        title: options.title ? options.title : message,
        showClose: true,
        message: options.title ? message : null,
        customClass: 'success',
        icon: successIcon,
        duration: 6000,
        dangerouslyUseHTMLString: true,
        position: 'bottom-right',
        offset: 24,
        ...options,
      },
    );
  }

  static error(payload, options = {}) {
    let message = payload;

    if (!message) {
      message = 'Ops, an error occurred';
    }

    ElNotification(
      {

        title: options.title ? options.title : message,
        showClose: true,
        message: options.title ? message : null,
        customClass: 'error',
        icon: errorIcon,
        duration: 6000,
        dangerouslyUseHTMLString: true,
        position: 'bottom-right',
        offset: 24,
        ...options,
      },
    );
  }

  static info(message, options = {}) {
    ElNotification(
      {

        title: options.title ? options.title : message,
        showClose: true,
        message: options.title ? message : null,
        customClass: 'info',
        icon: infoIcon,
        duration: 0,
        dangerouslyUseHTMLString: true,
        position: 'bottom-right',
        offset: 24,
        ...options,
      },
    );
  }

  static closeAll() {
    ElNotification.closeAll();
  }
}
