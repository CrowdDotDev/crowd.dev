<template>
  <div v-show="!success">
    <h3 class="text-2xl leading-12 font-semibold mb-1">
      You have no permissions yet. Wait for the admin to grant you privileges.
    </h3>
    <div class="pt-10">
      <el-button
        class="btn btn--primary btn--lg w-full"
        @click="doSignout()"
      >
        Sign out
      </el-button>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'AppEmptyPermissionsPage',
  computed: {},

  methods: {
    ...mapActions('auth', ['doSignout']),
  },
};
</script>
