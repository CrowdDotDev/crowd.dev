<template>
  <div>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner"
    />
    <h3
      v-if="warningMessage"
      class="text-2xl leading-12 font-semibold mb-10"
    >
      {{ warningMessage }}
    </h3>
    <div>
      <el-button
        v-if="warningMessage"
        :loading="loading"
        class="w-full btn btn--primary btn--lg"
        @click="doAcceptWithWrongEmail"
      >
        <app-i18n
          code="tenant.invitation.acceptWrongEmail"
        />
      </el-button>

      <div
        v-if="!loading"
        class="pt-11 flex justify-center"
      >
        <p
          class="text-base text-gray-600 font-medium leading-6 pl-2"
          @click="doSignout"
        >
          Sign out
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import AuthInvitationToken from '@/modules/auth/auth-invitation-token';
import { router } from '@/router';
import { TenantService } from '@/modules/tenant/tenant-service';
import Errors from '@/shared/error/errors';
import AppI18n from '@/shared/i18n/i18n.vue';

export default {
  name: 'AppInvitationPage',
  components: { AppI18n },
  data() {
    return {
      loading: false,
      warningMessage: null,
    };
  },

  computed: {
    ...mapGetters('auth', ['signedIn']),
    token() {
      return this.$route.query.token;
    },
  },

  created() {
    this.doAcceptFromAuth(this.token);
  },

  methods: {
    ...mapActions('auth', ['doSignout', 'doSelectTenant']),

    doAcceptWithWrongEmail() {
      this.doAcceptFromAuth(this.token, true);
    },
    doAcceptFromAuth(token, forceAcceptOtherEmail = false) {
      if (this.loading) {
        return;
      }

      if (!this.signedIn) {
        AuthInvitationToken.set(token);
        router.push('/auth/signin');
        return;
      }

      this.warningMessage = null;
      this.loading = true;

      TenantService.acceptInvitation(
        token,
        forceAcceptOtherEmail,
      )
        .then((tenant) => this.doSelectTenant(tenant))
        .then(() => {
          this.warningMessage = null;
          this.loading = false;
        })
        .catch((error) => {
          if (Errors.errorCode(error) === 404) {
            this.loading = false;
            router.push('/');
            return;
          }

          if (Errors.errorCode(error) === 400) {
            this.warningMessage = Errors.selectMessage(error);
            this.loading = false;
            return;
          }

          Errors.handle(error);
          this.warningMessage = null;
          this.loading = false;
          router.push('/');
        });
    },
  },
};
</script>

<style></style>
