<template>
  <div class="auth">
    <div class="wrapper" :style="wrapperStyle">
      <div class="content">
        <div class="logo">
          <h1>Welcome to crowd.dev</h1>
        </div>

        <el-form
          :model="model"
          :rules="rules"
          @submit.prevent.native="doSubmit"
          class="form"
          label-position="left"
          label-width="0px"
          ref="form"
        >
          <el-form-item :prop="fields.email.name">
            <el-input
              :placeholder="fields.email.label"
              auto-complete="off"
              ref="focus"
              type="text"
              v-model="model[fields.email.name]"
              id="email"
            ></el-input>
          </el-form-item>

          <el-form-item :prop="fields.password.name">
            <el-input
              :placeholder="fields.password.label"
              auto-complete="off"
              type="password"
              v-model="model[fields.password.name]"
              id="password"
            ></el-input>
          </el-form-item>

          <div>
            <div
              class="w-100"
              style="
                margin-bottom: 16px;
                display: flex;
                align-items: baseline;
                justify-content: space-between;
              "
            >
              <el-checkbox
                v-model="model[fields.rememberMe.name]"
                id="remember-me"
                >{{ fields.rememberMe.label }}</el-checkbox
              >

              <router-link
                :to="{ path: '/auth/forgot-password' }"
              >
                <el-button type="text">
                  <app-i18n
                    code="auth.forgotPassword"
                  ></app-i18n>
                </el-button>
              </router-link>
            </div>
          </div>

          <el-form-item>
            <el-button
              :loading="loading"
              native-type="submit"
              class="w-100 btn btn--primary"
              id="submit"
            >
              <app-i18n code="auth.signin"></app-i18n>
            </el-button>
          </el-form-item>

          <!-- <div class="other-actions">
            <router-link :to="{ path: '/auth/signup' }">
              <el-button type="text">
                <app-i18n
                  code="auth.createAnAccount"
                ></app-i18n>
              </el-button>
            </router-link>
          </div> -->
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { UserModel } from '@/premium/user/user-model'

const { fields } = UserModel

import { i18n } from '@/i18n'
import Message from '@/shared/message/message'
import config from '@/config'

export default {
  name: 'app-signin-page',

  data() {
    return {
      rules: {
        email: fields.email.forFormRules(),
        password: fields.password.forFormRules(),
        rememberMe: fields.rememberMe.forFormRules()
      },
      model: {
        rememberMe: true
      }
    }
  },

  created() {
    const { socialErrorCode } = this.$route.query

    if (socialErrorCode) {
      if (socialErrorCode === 'generic') {
        Message.error(i18n('errors.defaultErrorMessage'))
      } else {
        Message.error(
          i18n(`auth.social.errors.${socialErrorCode}`)
        )
      }
    }
  },

  computed: {
    ...mapGetters({
      loading: 'auth/loading',
      backgroundImageUrl: 'auth/backgroundImageUrl',
      logoUrl: 'auth/logoUrl',
      loadingInit: 'auth/loadingInit'
    }),

    fields() {
      return fields
    },

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
    }
  },

  methods: {
    ...mapActions({
      doSigninWithEmailAndPassword:
        'auth/doSigninWithEmailAndPassword'
    }),

    async doSubmit() {
      try {
        await this.$refs.form.validate()
      } catch (error) {
        return
      }

      await this.doSigninWithEmailAndPassword({
        email: this.model.email,
        password: this.model.password,
        rememberMe: this.model.rememberMe
      })
    },

    socialOauthLink(provider) {
      return `${config.backendUrl}/auth/social/${provider}`
    }
  }
}
</script>

<style></style>
