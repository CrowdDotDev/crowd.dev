import { defineNuxtConfig } from "nuxt";

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  buildModules: ["@nuxtjs/tailwindcss", 'vue-plausible'],
  plausible: {
    domain: 'open.crowd.dev'
  },
  modules:['@nuxtjs/robots'],
  // We need to transpile the heroicons module, for more info please take a look at
  // https://github.com/tailwindlabs/heroicons/issues/564#issuecomment-1024515731
  build: {
    transpile: ['@heroicons/vue']
  }
});
