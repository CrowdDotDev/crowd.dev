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

        <h3 style="font-weight: normal; text-align: center">
          <app-i18n
            :args="[email]"
            code="auth.emailUnverified.message"
          ></app-i18n>
        </h3>

        <el-button
          :loading="loading"
          @click="doSubmit"
          class="btn btn--primary w-full mt-4"
        >
          <app-i18n
            code="auth.emailUnverified.submit"
          ></app-i18n>
        </el-button>

        <div class="other-actions">
          <el-button @click="doSignout" type="text">
            <app-i18n code="auth.signout"></app-i18n>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { UserModel } from '@/premium/user/user-model'

const { fields } = UserModel

export default {
  name: 'app-email-unverified-page',

  data() {
    return {
      rules: {
        email: fields.email.forFormRules()
      },
      model: {}
    }
  },

  computed: {
    ...mapGetters({
      loading: 'auth/loadingEmailConfirmation',
      email: 'auth/currentUserEmail',
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

    fields() {
      return fields
    }
  },

  methods: {
    ...mapActions({
      doSendEmailConfirmation:
        'auth/doSendEmailConfirmation',
      doSignout: 'auth/doSignout'
    }),

    async doSubmit() {
      await this.doSendEmailConfirmation(this.model.email)
    }
  }
}
</script>

<style></style>
