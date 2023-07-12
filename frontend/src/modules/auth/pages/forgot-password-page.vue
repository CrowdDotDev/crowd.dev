<template>
  <div v-show="!success">
    <h3 class="text-2xl leading-12 font-semibold mb-1">
      Password recovery
    </h3>
    <p class="text-gray-500 text-xs leading-5">
      Enter your e-mail and we’ll send the instructions to
      reset your password
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
          class="mb-4"
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

        <el-form-item class="mb-4">
          <el-button
            id="submit"
            :loading="loadingPasswordResetEmail"
            native-type="submit"
            class="w-full btn btn--primary btn--lg"
          >
            <app-i18n
              code="auth.passwordResetEmail.message"
            />
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
          />
          <span
            class="text-base text-gray-600 font-medium leading-6 pl-2"
          >Back to sign in</span>
        </router-link>
      </div>
    </div>
  </div>
  <!-- success state -->
  <div v-show="success">
    <h3 class="text-2xl leading-12 font-semibold mb-10">
      Check your e-mail
    </h3>
    <div class="flex items-center pb-8">
      <div>
        <i
          class="ri-mail-send-line text-5xl text-brand-200"
        />
      </div>
      <div class="pl-6">
        <p class="text-base leading-6">
          We sent the password recovery instructions to
          <span class="font-medium">{{ model.email }}</span>
        </p>
      </div>
    </div>
    <p class="text-xs text-gray-500 leading-5 pb-8">
      Didn’t receive the e-mail? Check your spam folder or
      ask to resend
    </p>
    <el-button
      :loading="loadingPasswordResetEmail"
      class="btn btn--primary btn--lg w-full"
      @click="resend()"
    >
      Resend e-mail
    </el-button>
    <div class="pt-11 flex justify-center">
      <router-link
        :to="{ name: 'signin' }"
        class="flex items-center"
      >
        <i
          class="ri-arrow-left-line text-lg text-gray-600"
        />
        <span
          class="text-base text-gray-600 font-medium leading-6 pl-2"
        >Back to sign in</span>
      </router-link>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { UserModel } from '@/modules/user/user-model';
import Message from '@/shared/message/message';
import { i18n } from '@/i18n';
import AppI18n from '@/shared/i18n/i18n.vue';
import { Auth0Service } from "@/shared/services/auth0.service";

const { fields } = UserModel;

export default {
  name: 'AppForgotPasswordPage',
  components: { AppI18n },
  data() {
    return {
      rules: {
        email: fields.email.forFormRules(),
      },
      model: {},
      success: false,
    };
  },

  computed: {
    ...mapGetters('auth', ['loadingPasswordResetEmail']),

    fields() {
      return fields;
    },
  },

  methods: {
    ...mapActions('auth', ['doSendPasswordResetEmail']),
    doSubmit() {
      return this.$refs.form
        .validate()
        .then(() => Auth0Service.changePassword(
          this.model.email,
        ))
        .then(() => {
          this.success = true;
          return Promise.resolve();
        });
    },
    resend() {
      this.doSubmit().then(() => {
        Message.success(
          i18n('auth.passwordResetEmailSuccess'),
        );
      });
    },
  },
};
</script>

<style></style>
