import { ElMessageBox } from 'element-plus'

/**
 * Small wrapper of the $confirm plugin (from ElementUI library)
 *
 * We've built this plugin to add our own button-classes (as default) when triggering $confirm prompts/modals.
 */
export default {
  install(app) {
    app.config.globalProperties.$myConfirm = (
      message,
      title,
      options
    ) => {
      Object.assign(options, {
        customClass: 'confirm',
        cancelButtonClass: 'btn btn--secondary mr-2',
        confirmButtonClass: 'btn btn--primary'
      })

      return ElMessageBox.confirm(message, title, options)
    }
  }
}
