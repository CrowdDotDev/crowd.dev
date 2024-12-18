import { marked } from 'marked';

export default {
  install: (app) => {
    // eslint-disable-next-line no-param-reassign
    app.config.globalProperties.$marked = (
      markdownString,
      options,
    ) => {
      marked.setOptions(options);

      return marked.parse(markdownString);
    };
  },
};
