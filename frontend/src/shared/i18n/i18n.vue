<template>
  <span v-html="message"></span>
</template>

<script>
import { i18n } from '@/i18n'

export default {
  name: 'app-i18n',
  props: ['code', 'args', 'fallback'],
  computed: {
    message: function () {
      const translated = i18n(
        this.code,
        ...(this.args || [])
      )
      return this.fallback !== undefined &&
        translated === this.code
        ? i18n(this.fallback)
        : translated
    }
  }
}
</script>

<style></style>
