<template>
  <div v-show="!success">
    <h3 class="text-2xl leading-12 font-semibold mb-1">
      Create new password
    </h3>
    <p class="text-gray-500 text-xs leading-5">
      Choose a password different from the ones you used
      before
    </p>
    <div class="pt-10">
      <el-form
        ref="form"
        :model="model"
        :rules="extendedRules"
        class="form"
        label-position="left"
        label-width="0px"
        @submit.prevent="doSubmit"
      >
        <el-form-item
          :prop="fields.password.name"
          class="mb-0"
        >
          <label
            for="password"
            class="text-xs mb-1 font-semibold leading-5"
            >New password</label
          >
          <el-input
            id="password"
            v-model="model[fields.password.name]"
            autocomplete="current-password"
            :type="display.password ? 'text' : 'password'"
          >
            <template #suffix>
              <span
                class="ri-eye-line text-base text-gray-400 cursor-pointer"
                @click="
                  display.password = !display.password
                "
              ></span>
            </template>
          </el-input>
          <template #error="{ error }">
            <div class="flex items-center mt-1">
              <i
                class="h-4 flex items-center ri-error-warning-line text-base text-red-500"
              ></i>
              <span
                class="pl-1 text-2xs text-red-500 leading-4.5"
                >{{ error }}</span
              >
            </div>
          </template>
        </el-form-item>

        <el-form-item
          :prop="fields.passwordConfirmation.name"
        >
          <label
            for="passwordConfirmation"
            class="text-xs mb-1 font-semibold leading-5"
            >Confirm new password</label
          >
          <el-input
            id="passwordConfirmation"
            v-model="
              model[fields.passwordConfirmation.name]
            "
            autocomplete="new-password"
            :type="
              display.passwordConfirmation
                ? 'text'
                : 'password'
            "
          >
            <template #suffix>
              <span
                class="ri-eye-line text-base text-gray-400 cursor-pointer"
                @click="
                  display.passwordConfirmation =
                    !display.passwordConfirmation
                "
              ></span>
            </template>
          </el-input>
          <template #error="{ error }">
            <div class="flex items-center mt-1">
              <i
                class="h-4 flex items-center ri-error-warning-line text-base text-red-500"
              ></i>
              <span
                class="pl-1 text-2xs text-red-500 leading-4.5"
                >{{ error }}</span
              >
            </div>
          </template>
        </el-form-item>

        <el-form-item>
          <el-button
            id="submit"
            :loading="loadingPasswordReset"
            native-type="submit"
            class="w-full btn btn--primary btn--lg"
          >
            <app-i18n
              code="auth.passwordReset.message"
            ></app-i18n>
          </el-button>
        </el-form-item>
      </el-form>
      <div class="pt-3 flex justify-center">
        <router-link
          :to="{ name: 'signin' }"
          class="flex items-center"
        >
          <i
            class="ri-arrow-left-line text-lg text-gray-600"
          ></i>
          <span
            class="text-base text-gray-600 font-medium leading-6 pl-2"
            >Back to sign in</span
          >
        </router-link>
      </div>
    </div>
  </div>
  <div v-show="success">
    <h3 class="text-2xl leading-12 font-semibold mb-10">
      Password reset
    </h3>
    <div class="flex items-center pb-10">
      <div>
        <i
          class="ri-checkbox-circle-line text-5xl text-green-200"
        ></i>
      </div>
      <div class="pl-6">
        <p class="text-base leading-6">
          You have successfuly reset your password
        </p>
      </div>
    </div>
    <router-link :to="{ name: 'signin' }">
      <el-button
        id="continueSignIn"
        class="btn btn--primary btn--lg w-full"
      >
        Continue to sign in
      </el-button>
    </router-link>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { UserModel } from '@/modules/user/user-model'
import AppI18n from '@/shared/i18n/i18n'
import { passwordConfirmRules } from '@/modules/auth/auth-helpers'
const { fields } = UserModel

export default {
  name: 'AppPasswordResetPage',
  components: { AppI18n },
  data() {
    return {
      rules: {
        password: fields.password.forFormRules(),
        passwordConfirmation:
          fields.passwordConfirmation.forFormRules()
      },
      model: {},
      success: false,
      display: {
        password: false,
        passwordConfirmation: false
      }
    }
  },

  computed: {
    ...mapGetters('auth', ['loadingPasswordReset']),

    fields() {
      return fields
    },

    extendedRules() {
      return passwordConfirmRules(
        this.rules,
        fields,
        this.model
      )
    }
  },

  methods: {
    ...mapActions('auth', ['doResetPassword']),

    doSubmit() {
      this.$refs.form
        .validate()
        .then(() => {
          return this.doResetPassword({
            token: this.$route.query.token,
            password: this.model.password
          })
        })
        .then(() => {
          this.success = true
        })
    }
  }
}
</script>
