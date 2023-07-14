<template>
  <div>
    <h3 class="text-2xl leading-12 font-semibold mb-1">
      Accept terms of service & privacy policy
    </h3>
    <div class="pt-10">
      <div class="pb-4">
        <el-checkbox
          id="remember-me"
          v-model="model[fields.acceptedTermsAndPrivacy.name]"
        >
          <span class="text-sm text-gray-900" /><span class="text-sm text-gray-900">  I accept the <a
            href="https://www.crowd.dev/terms-of-use"
            target="_blank"
            rel="noopener noreferrer"
          >terms of service</a>
            and <a
              href="https://www.crowd.dev/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >privacy policy</a>.
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
      </div>

      <el-button
        id="submit"
        :loading="loading"
        :disabled="!model[fields.acceptedTermsAndPrivacy.name]"
        native-type="submit"
        class="w-full btn btn--primary btn--lg"
        @click="doSubmit"
      >
        Continue
      </el-button>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import { UserModel } from '@/modules/user/user-model';
import { AuthService } from '@/modules/auth/auth-service';

const { fields } = UserModel;

export default {
  name: 'AppSignupPage',
  data() {
    return {
      model: {},
      acceptTerms: false,
      loading: false,
    };
  },

  computed: {
    ...mapGetters('auth', ['currentUser']),
    fields() {
      return fields;
    },
  },

  mounted() {
    if (!this.currentUser) {
      this.$router.push('/auth/signin');
    }
  },

  methods: {
    ...mapActions('auth', ['doRefreshCurrentUser']),

    doSubmit() {
      if (this.model.acceptedTermsAndPrivacy) {
        this.loading = true;
        AuthService.updateProfile({
          acceptedTermsAndPrivacy: this.model.acceptedTermsAndPrivacy,
        })
          .then(() => this.doRefreshCurrentUser())
          .then(() => {
            this.$router.push('/');
          })
          .finally(() => {
            this.loading = false;
          });
      } else {
        this.acceptTerms = true;
      }
    },
  },
};
</script>
