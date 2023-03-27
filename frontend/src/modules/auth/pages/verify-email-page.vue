<template>
  <div>
    <h3 class="text-2xl leading-12 font-semibold mb-1">
      Just a moment, your email is being verified...
    </h3>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'AppVerifyEmailPage',

  mounted() {
    this.doVerifyEmail(this.$route.query.token);
  },

  methods: {
    ...mapActions('auth', ['doVerifyEmail']),
  },
};
</script>
