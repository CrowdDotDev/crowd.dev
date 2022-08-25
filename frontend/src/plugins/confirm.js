/**
 * Small wrapper of the $confirm plugin (from ElementUI library)
 *
 * We've built this plugin to add our own button-classes (as default) when triggering $confirm prompts/modals.
 */
export default {
  install(Vue) {
    Vue.prototype.$myConfirm = (
      message,
      title,
      options
    ) => {
      Object.assign(options, {
        cancelButtonClass: 'btn btn--secondary',
        confirmButtonClass: 'btn btn--primary'
      })

      return Vue.prototype.$confirm(message, title, options)
    }
  }
}
