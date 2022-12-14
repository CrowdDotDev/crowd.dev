import { marked } from 'marked'

export default {
  install: (app) => {
    app.config.globalProperties.$marked = (
      markdownString,
      options
    ) => {
      marked.setOptions(options)

      return marked.parse(markdownString)
    }
  }
}
