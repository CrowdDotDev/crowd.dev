<template>
  <div class="i18n-select">
    <el-select
      :value="value"
      placeholder
      @change="doChangeLanguage"
    >
      <el-option
        v-for="language in languages"
        :key="language.id"
        :label="language.label"
        :value="language.id"
        @mouseleave="onSelectMouseLeave"
      />
    </el-select>
  </div>
</template>

<script>
import { I18nUtil } from '@/shared/i18n/i18n-util';
import { getLanguages, getLanguageCode } from '@/i18n';
import { onSelectMouseLeave } from '@/utils/select';

export default {
  name: 'AppI18nSelect',

  data() {
    return {
      value: getLanguageCode(),
    };
  },

  computed: {
    languages() {
      return getLanguages();
    },
  },

  methods: {
    doChangeLanguage(language) {
      I18nUtil.doChangeLanguage(language);
    },

    onSelectMouseLeave,
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
