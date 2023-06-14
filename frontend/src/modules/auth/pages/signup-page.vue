<template>
  <div>
    <h3 class="text-2xl leading-12 font-semibold mb-1">
      Create an account
    </h3>
    <p class="text-gray-500 text-xs leading-5">
      Turn your developer community into your #1 growth
      channel
    </p>
    <div class="pt-10">
      <el-form
        ref="form"
        :model="model"
        :rules="extendedRules"
        class="form mb-2"
        label-position="left"
        label-width="0px"
        @submit.prevent="doSubmit"
      >
        <div class="flex flex-wrap -mx-2">
          <div class="w-full md:w-1/2 lg:w-1/2 px-2">
            <el-form-item
              :prop="fields.firstName.name"
              class="mb-0"
            >
              <label
                for="firstName"
                class="text-xs mb-1 font-semibold leading-5"
              >{{ fields.firstName.label }}</label>
              <el-input
                id="firstName"
                ref="focus"
                v-model="model[fields.firstName.name]"
                autocomplete="given-name"
                type="text"
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
          </div>
          <div class="w-full md:w-1/2 lg:w-1/2 px-2">
            <el-form-item
              :prop="fields.lastName.name"
              class="mb-0"
            >
              <label
                for="lastName"
                class="text-xs mb-1 font-semibold leading-5"
              >{{ fields.lastName.label }}</label>
              <el-input
                id="lastName"
                v-model="model[fields.lastName.name]"
                autocomplete="family-name"
                type="text"
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
          </div>
        </div>
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
            autocomplete="disableauto"
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
                class="pl-1 text-2xs text-red-500 leading-4.5"
              >{{ error }}</span>
            </div>
          </template>
        </el-form-item>

        <el-form-item
          :prop="fields.passwordConfirmation.name"
          class="mb-0"
        >
          <label
            for="passwordConfirmation"
            class="text-xs mb-1 font-semibold leading-5"
          >{{ fields.passwordConfirmation.label }}</label>
          <el-input
            id="passwordConfirmation"
            v-model="
              model[fields.passwordConfirmation.name]
            "
            autocomplete="disableauto"
            :type="
              display.passwordConfirm ? 'text' : 'password'
            "
          >
            <template #suffix>
              <span
                class="ri-eye-line text-base text-gray-400 cursor-pointer"
                @click="
                  display.passwordConfirm = !display.passwordConfirm
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
                class="pl-1 text-2xs text-red-500 leading-4.5"
              >{{ error }}</span>
            </div>
          </template>
        </el-form-item>

        <el-form-item class="pt-4 mb-0">
          <el-button
            id="submit"
            :loading="loading"
            native-type="submit"
            class="w-full btn btn--primary btn--lg"
          >
            <app-i18n code="auth.signup" />
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
          id="googleSignup"
          :href="socialOauthLink('google')"
          class="btn btn--secondary btn--lg w-full"
        >
          <app-svg name="google" class="h-5 w-5" />
          <span class="pl-3 text-gray-600">Sign up with Google</span>
        </a>
        <a
          id="githubSignup"
          :href="socialOauthLink('github')"
          class="btn btn--secondary btn--lg w-full"
        >
          <app-svg name="github" class="h-5 w-5" />
          <span class="pl-3 text-gray-600">Sign up with GitHub</span>
        </a>
      </div>
      <div class="flex justify-center">
        <p class="text-sm leading-5 text-center">
          Already have an account?
          <router-link :to="{ name: 'signin' }">
            Sign in
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { UserModel } from '@/modules/user/user-model';
import config from '@/config';
import { passwordConfirmRules } from '@/modules/auth/auth-helpers';
import AppI18n from '@/shared/i18n/i18n.vue';
import AppSvg from '@/shared/svg/svg.vue';

const { fields } = UserModel;

export default {
  name: 'AppSignupPage',
  components: { AppSvg, AppI18n },
  data() {
    return {
      rules: {
        firstName: fields.firstName.forFormRules(),
        lastName: fields.lastName.forFormRules(),
        email: fields.email.forFormRules(),
        password: fields.password.forFormRules(),
        passwordConfirmation:
          fields.passwordConfirmation.forFormRules(),
      },
      model: {},
      display: {
        password: false,
        passwordConfirm: false,
      },
    };
  },

  computed: {
    ...mapGetters('auth', ['loading']),

    fields() {
      return fields;
    },

    extendedRules() {
      return passwordConfirmRules(
        this.rules,
        fields,
        this.model,
      );
    },
  },

  methods: {
    ...mapActions('auth', ['doRegisterEmailAndPassword']),

    doSubmit() {
      this.$refs.form.validate().then(() => this.doRegisterEmailAndPassword({
        email: this.model.email,
        password: this.model.password,
        data: {
          firstName: this.model.firstName,
          lastName: this.model.lastName,
        },
      }));
    },

    socialOauthLink(provider) {
      return `${config.backendUrl}/auth/social/${provider}`;
    },
  },
};
</script>
