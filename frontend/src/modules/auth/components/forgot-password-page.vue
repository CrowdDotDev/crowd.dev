<template>
  <div class="auth">
    <div class="wrapper" :style="wrapperStyle">
      <div class="content">
        <div class="logo">
          <h1>Recover Password</h1>
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

          <el-form-item>
            <el-button
              id="submit"
              :loading="loading"
              native-type="submit"
              class="w-100 btn btn--primary"
            >
              <app-i18n
                code="auth.passwordResetEmail.message"
              ></app-i18n>
            </el-button>
          </el-form-item>

          <div class="other-actions">
            <router-link :to="{ path: '/auth/signin' }">
              <el-button type="text">
                <app-i18n code="common.cancel"></app-i18n>
              </el-button>
            </router-link>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { UserModel } from '@/premium/user/user-model'

const { fields } = UserModel

export default {
  name: 'AppForgotPasswordPage',

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
      loading: 'auth/loadingPasswordResetEmail',
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
      doSendPasswordResetEmail:
        'auth/doSendPasswordResetEmail'
    }),

    async doSubmit() {
      try {
        await this.$refs.form.validate()
      } catch (error) {
        return
      }

      await this.doSendPasswordResetEmail(this.model.email)
    }
  }
}
</script>

<style></style>
