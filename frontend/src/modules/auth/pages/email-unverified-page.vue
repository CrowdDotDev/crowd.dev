<template>
  <h3 class="text-2xl leading-12 font-semibold pb-10">
    Check your e-mail
  </h3>
  <div class="flex items-center pb-10">
    <div>
      <i
        class="ri-mail-send-line text-5xl text-brand-200"
      />
    </div>
    <div class="pl-6">
      <p class="text-base leading-6">
        Please confirm your e-mail at
        <span class="font-medium">{{
          currentUserEmail
        }}</span>
        to continue
      </p>
    </div>
  </div>

  <router-link :to="{ name: 'signin' }">
    <el-button
      :loading="loadingEmailConfirmation"
      class="btn btn--secondary btn--lg w-full"
    >
      Continue to sign in
    </el-button>
  </router-link>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'AppEmailUnverifiedPage',

  computed: {
    ...mapGetters('auth', [
      'loadingEmailConfirmation',
      'currentUserEmail',
    ]),
  },

  methods: {
    ...mapActions('auth', ['doSendEmailConfirmation']),

    doSubmit() {
      this.doSendEmailConfirmation(this.email);
    },
  },
};
</script>

<style></style>
