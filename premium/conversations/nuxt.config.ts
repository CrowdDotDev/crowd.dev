import { defineNuxtConfig } from "nuxt";

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  buildModules: ["@nuxtjs/tailwindcss", '@nuxtjs/markdownit', 'vue-plausible'],
  markdownit: {
    runtime: true // Support `$md()`
  },
  plausible: {
    domain: 'open.crowd.dev'
  },
  // We need to transpile the heroicons module, for more info please take a look at
  // https://github.com/tailwindlabs/heroicons/issues/564#issuecomment-1024515731
  build: {
    transpile: ['@heroicons/vue']
  }
});
