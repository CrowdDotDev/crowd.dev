<template>
  <div class="auth">
    <div class="wrapper" :style="wrapperStyle">
      <div class="content">
        <div class="logo">
          <img
            v-if="logoUrl"
            :src="logoUrl"
            width="240px"
            alt=""
          />
          <h1 v-if="!logoUrl">
            <app-i18n code="app.title"></app-i18n>
          </h1>
        </div>

        <div
          v-if="loading"
          v-loading="loading"
          class="app-page-spinner"
        ></div>

        <h3
          v-if="warningMessage"
          style="font-weight: normal; text-align: center"
        >
          {{ warningMessage }}
        </h3>

        <el-button
          v-if="warningMessage"
          :loading="loading"
          class="w-100 btn btn--primary"
          @click="doAcceptWithWrongEmail"
        >
          <app-i18n
            code="tenant.invitation.acceptWrongEmail"
          ></app-i18n>
        </el-button>

        <div v-if="!loading" class="other-actions">
          <el-button type="text" @click="doSignout">
            <app-i18n code="auth.signout"></app-i18n>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'AppInvitationPage',
  data() {
    return {}
  },

  created() {
    return this.doAcceptFromAuth({
      token: this.$route.query.token
    })
  },

  computed: {
    ...mapGetters({
      warningMessage: 'tenant/invitation/warningMessage',
      loading: 'tenant/invitation/loading',
      backgroundImageUrl: 'auth/backgroundImageUrl',
      logoUrl: 'auth/logoUrl'
    }),

    wrapperStyle() {
      const backgroundImageUrl =
        this.backgroundImageUrl || `/images/icon.png`

      return {
        backgroundColor: '#140505',
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: 'auto',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left 100px bottom 100px'
      }
    },

    token() {
      return this.$route.query.token
    }
  },

  methods: {
    ...mapActions({
      doAcceptFromAuth:
        'tenant/invitation/doAcceptFromAuth',
      doSignout: 'auth/doSignout'
    }),

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
