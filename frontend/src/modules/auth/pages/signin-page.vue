<template>
  <div>
    <h3 class="text-2xl leading-12 font-semibold mb-1">
      👋 Welcome back
    </h3>
    <p class="text-gray-500 text-xs leading-5">
      Please enter your credentials
    </p>
    <div class="pt-10">
      <el-form
        ref="form"
        :model="model"
        :rules="rules"
        class="form"
        label-position="left"
        label-width="0px"
        @submit.prevent="doSubmit"
      >
        <el-form-item
          :prop="fields.email.name"
          class="mb-0"
        >
          <label
            for="email"
            class="text-xs mb-1 font-semibold leading-5"
          >{{ fields.email.label }}</label>
          <el-input
            id="email"
            ref="focus"
            v-model="model[fields.email.name]"
            autocomplete="email"
            type="email"
          />
          <template #error="{ error }">
            <div class="flex items-center mt-1">
              <i
                class="h-4 flex items-center ri-error-warning-line text-base text-red-500"
              />
              <span
                class="pl-1 text-2xs text-red-500 leading-4.5"
              >{{ error }}</span>
            </div>
          </template>
        </el-form-item>

        <el-form-item
          :prop="fields.password.name"
          class="mb-0"
        >
          <label
            for="password"
            class="text-xs mb-1 font-semibold leading-5"
          >{{ fields.password.label }}</label>
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
              />
            </template>
          </el-input>
          <template #error="{ error }">
            <div class="flex items-center mt-1">
              <i
                class="h-4 flex items-center ri-error-warning-line text-base text-red-500"
              />
              <span
                v-if="error === 'Password is invalid'"
                class="pl-1 text-2xs text-red-500 leading-4.5"
              >Passwords must have at least one letter, one number, one symbol, and be at least 8 characters long.</span>
              <span
                v-else
                class="pl-1 text-2xs text-red-500 leading-4.5"
              >{{ error }}</span>
            </div>
          </template>
        </el-form-item>

        <div
          class="pt-2 flex justify-between items-center pb-8"
        >
          <el-checkbox
            id="remember-me"
            v-model="model[fields.rememberMe.name]"
          >
            <span class="text-sm text-gray-900">{{
              fields.rememberMe.label
            }}</span>
          </el-checkbox>
          <router-link
            :to="{ name: 'forgotPassword' }"
            class="text-brand-500 text-sm leading-5"
          >
            <app-i18n code="auth.forgotPassword" />
          </router-link>
        </div>

        <el-form-item class="mb-0">
          <el-button
            id="submit"
            :loading="loading"
            native-type="submit"
            class="w-full btn btn--primary btn--lg"
          >
            <app-i18n code="auth.signin" />
          </el-button>
        </el-form-item>
      </el-form>
      <div class="flex items-center">
        <div class="flex-grow border-b border-gray-200" />
        <div
          class="py-0.5 px-3 text-xs leading-5 text-gray-500"
        >
          OR
        </div>
        <div class="flex-grow border-b border-gray-200" />
      </div>
      <div class="flex flex-col pt-6 pb-16 gap-6">
        <a
          id="googleLogin"
          :href="socialOauthLink('google')"
          class="btn btn--secondary btn--lg w-full"
        >
          <app-svg name="google" class="h-5 w-5" />
          <span class="pl-3 text-gray-600">Sign in with Google</span>
        </a>
        <a
          id="githubLogin"
          :href="socialOauthLink('github')"
          class="btn btn--secondary btn--lg w-full"
        >
          <i class="ri-github-fill text-lg !text-gray-600" />
          <span class="pl-1 text-gray-600">Sign in with GitHub</span>
        </a>
      </div>
      <div class="flex justify-center">
        <p class="text-sm leading-5 text-center">
          Don't have an account yet?
          <router-link :to="{ name: 'signup' }">
            Create a free account
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { UserModel } from '@/modules/user/user-model';

import { i18n } from '@/i18n';
import Message from '@/shared/message/message';
import config from '@/config';
import AppI18n from '@/shared/i18n/i18n.vue';
import AppSvg from '@/shared/svg/svg.vue';

const { fields } = UserModel;

export default {
  name: 'AppSigninPage',
  components: { AppSvg, AppI18n },
  data() {
    return {
      rules: {
        email: fields.email.forFormRules(),
        password: fields.password.forFormRules(),
        rememberMe: fields.rememberMe.forFormRules(),
      },
      model: {
        rememberMe: true,
      },
      display: {
        password: false,
      },
    };
  },

  computed: {
    ...mapGetters('auth', ['loading']),

    fields() {
      return fields;
    },
  },

  created() {
    const { socialErrorCode } = this.$route.query;

    if (socialErrorCode) {
      if (socialErrorCode === 'generic') {
        Message.error(i18n('errors.defaultErrorMessage'));
      } else {
        Message.error(
          i18n(`auth.social.errors.${socialErrorCode}`),
        );
      }
    }
  },

  methods: {
    ...mapActions('auth', ['doSigninWithEmailAndPassword']),
    doSubmit() {
      this.$refs.form.validate().then(() => this.doSigninWithEmailAndPassword({
        email: this.model.email,
        password: this.model.password,
        rememberMe: this.model.rememberMe,
      }));
    },

    socialOauthLink(provider) {
      return `${config.backendUrl}/auth/social/${provider}`;
    },
  },
};
</script>

<style></style>
