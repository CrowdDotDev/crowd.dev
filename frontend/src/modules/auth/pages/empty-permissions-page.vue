<template>
  <div v-show="!success">
    <h3 class="text-2xl leading-12 font-semibold mb-1">
      <app-i18n
        code="auth.emptyPermissions.message"
      ></app-i18n>
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
import { mapActions } from 'vuex'
import AppI18n from '@/shared/i18n/i18n'

export default {
  name: 'AppEmptyPermissionsPage',
  components: { AppI18n },
  computed: {},

  methods: {
    ...mapActions('auth', ['doSignout'])
  }
}
</script>
