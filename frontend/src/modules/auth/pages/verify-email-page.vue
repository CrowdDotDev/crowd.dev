<template>
  <div>
    <h3 class="text-2xl leading-12 font-semibold mb-1">
      <app-i18n code="auth.verifyEmail.message"></app-i18n>
    </h3>
  </div>
</template>

<script>
import AppI18n from '@/shared/i18n/i18n'
import { mapActions } from 'vuex'

export default {
  name: 'AppVerifyEmailPage',
  components: { AppI18n },

  mounted() {
    this.doVerifyEmail(this.$route.query.token)
  },

  methods: {
    ...mapActions('auth', ['doVerifyEmail'])
  }
}
</script>
