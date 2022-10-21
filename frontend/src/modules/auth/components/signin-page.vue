<template>
  <div class="auth">
    <div class="wrapper" :style="wrapperStyle">
      <div class="content">
        <div class="logo">
          <h1>Welcome to crowd.dev</h1>
        </div>

        <el-form
          ref="form"
          :model="model"
          :rules="rules"
          class="form"
          label-position="left"
          label-width="0px"
          @submit.prevent="doSubmit"
        >
          <el-form-item :prop="fields.email.name">
            <el-input
              id="email"
              ref="focus"
              v-model="model[fields.email.name]"
              :placeholder="fields.email.label"
              auto-complete="off"
              type="text"
            ></el-input>
          </el-form-item>

          <el-form-item :prop="fields.password.name">
            <el-input
              id="password"
              v-model="model[fields.password.name]"
              :placeholder="fields.password.label"
              auto-complete="off"
              type="password"
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
                id="remember-me"
                v-model="model[fields.rememberMe.name]"
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
              id="submit"
              :loading="loading"
              native-type="submit"
              class="w-100 btn btn--primary"
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
        <a
          :href="socialOauthLink('google')"
          class="btn btn--secondary py-2"
        >
          <i class="ri-google-fill mr-1"></i> Sign in with
          Google
        </a>

        <div class="other-actions">
          <router-link :to="{ path: '/auth/signup' }">
            <el-button type="text">
              <app-i18n
                code="auth.createAnAccount"
              ></app-i18n>
            </el-button>
          </router-link>
        </div>
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
  name: 'AppSigninPage',

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
