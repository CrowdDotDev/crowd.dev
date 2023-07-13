<template>
  <div>
    <h3 class="text-2xl leading-12 font-semibold mb-1">
      Accept terms of service & privacy policy
    </h3>
    <p class="text-gray-500 text-xs leading-5">
      You have to accept terms of service and privacy policy before continuing
    </p>
    <div class="pt-10">
      <el-form
        ref="form"
        :model="model"
        class="form mb-2"
        label-position="left"
        label-width="0px"
        @submit.prevent="doSubmit"
      >
        <el-checkbox
          id="remember-me"
          v-model="model[fields.acceptedTermsAndPrivacy.name]"
        >
          <span class="text-sm text-gray-900">
            I hereby accept the <a href="https://www.crowd.dev/terms-of-use" target="_blank" rel="noopener noreferrer">terms of service</a>
            and <a href="https://www.crowd.dev/privacy-policy" target="_blank" rel="noopener noreferrer">privacy policy</a>.
          </span>
        </el-checkbox>
        <div v-if="acceptTerms && !model[fields.acceptedTermsAndPrivacy.name]" class="flex items-center mt-1">
          <i
            class="h-4 flex items-center ri-error-warning-line text-base text-red-500"
          />
          <span
            class="pl-1 text-2xs text-red-500 leading-4.5"
          >You have to accept terms of service and privacy policy before continuing</span>
        </div>

        <el-form-item class="pt-4 mb-0">
          <el-button
            id="submit"
            :loading="loading"
            native-type="submit"
            class="w-full btn btn--primary btn--lg"
          >
            Continue
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { UserModel } from '@/modules/user/user-model';
import config from '@/config';
import { passwordConfirmRules } from '@/modules/auth/auth-helpers';

const { fields } = UserModel;

export default {
  name: 'AppSignupPage',
  data() {
    return {
      model: {},
      acceptTerms: false,
    };
  },

  computed: {
    ...mapGetters('auth', ['loading']),

    fields() {
      return fields;
    },

  },

  methods: {
    ...mapActions('auth', ['doRegisterEmailAndPassword']),

    doSubmit() {
      this.acceptTerms = false;
      this.$refs.form.validate().then(() => {
        if (this.model.acceptedTermsAndPrivacy) {
          this.doRegisterEmailAndPassword({
            email: this.model.email,
            password: this.model.password,
            data: {
              firstName: this.model.firstName,
              lastName: this.model.lastName,
            },
            acceptedTermsAndPrivacy: this.model.acceptedTermsAndPrivacy,
          });
        } else {
          this.acceptTerms = true;
        }
      });
    },

    socialOauthLink(provider) {
      return `${config.backendUrl}/auth/social/${provider}`;
    },
  },
};
</script>
