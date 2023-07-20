<template>
  <div class="text-center">
    <h4 class="mb-2">
      You have no permissions yet.
    </h4>
    <div class="font-semibold text-base">
      Wait for the admin to grant you privileges.
    </div>
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
