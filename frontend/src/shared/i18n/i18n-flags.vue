<template>
  <div class="i18n-flags">
    <img
      v-for="language in languages"
      :key="language.id"
      :alt="language.label"
      :src="language.flag"
      :title="language.label"
      @click="doChangeLanguage(language.id)"
    />
  </div>
</template>

<script>
import { I18nUtil } from '@/shared/i18n/i18n-util';
import { getLanguages } from '@/i18n';

export default {
  name: 'AppI18nFlags',

  computed: {
    languages() {
      return getLanguages();
    },
  },

  methods: {
    doChangeLanguage(language) {
      I18nUtil.doChangeLanguage(language);
    },
  },
};
</script>

<style>
.i18n-flags {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 24px;
}

.i18n-flags img {
  margin-right: 8px;
  cursor: pointer;
}
</style>
