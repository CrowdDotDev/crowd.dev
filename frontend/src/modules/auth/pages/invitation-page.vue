<template>
  <div>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner"
    ></div>
    <h3
      v-if="warningMessage"
      class="text-2xl leading-12 font-semibold mb-10"
    >
      {{ warningMessage }}
    </h3>
    <div>
      <el-button
        v-if="warningMessage"
        :loading="loading"
        class="w-100 btn btn--primary btn--lg"
        @click="doAcceptWithWrongEmail"
      >
        <app-i18n
          code="tenant.invitation.acceptWrongEmail"
        ></app-i18n>
      </el-button>

      <div
        v-if="!loading"
        class="pt-11 flex justify-center"
      >
        <p
          class="text-base text-gray-600 font-medium leading-6 pl-2"
          @click="doSignout"
        >
          Sign out
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import AppI18n from '@/shared/i18n/i18n'

export default {
  name: 'AppInvitationPage',
  components: { AppI18n },
  data() {
    return {}
  },

  computed: {
    ...mapGetters('tenant/invitation', [
      'warningMessage',
      'loading'
    ]),

    token() {
      return this.$route.query.token
    }
  },

  created() {
    this.doAcceptFromAuth({
      token: this.token
    })
  },

  methods: {
    ...mapActions('tenant/invitation', [
      'doAcceptFromAuth'
    ]),
    ...mapActions('auth', ['doSignout']),

    doAcceptWithWrongEmail() {
      return this.doAcceptFromAuth({
        token: this.token,
        forceAcceptOtherEmail: true
      })
    }
  }
}
</script>

<style></style>
