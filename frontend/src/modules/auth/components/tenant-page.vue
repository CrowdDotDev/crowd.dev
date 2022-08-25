<template>
  <div class="auth">
    <div class="wrapper" :style="wrapperStyle">
      <div class="content">
        <div class="logo">
          <img
            v-if="logoUrl"
            :src="logoUrl"
            width="240px"
            alt=""
          />
          <h1 v-if="!logoUrl">
            <app-i18n code="app.title"></app-i18n>
          </h1>
        </div>

        <app-tenant-new-form
          @viewToggle="doToggleView()"
          v-if="view === 'form'"
        />
        <app-tenant-select-form
          @viewToggle="doToggleView()"
          v-if="view === 'select'"
        />

        <div class="other-actions">
          <el-button @click="doSignout" type="text">
            <app-i18n code="auth.signout"></app-i18n>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import TenantNewForm from '@/modules/auth/components/tenant-new-form.vue'
import TenantSelectForm from '@/modules/auth/components/tenant-select-form.vue'

export default {
  name: 'app-tenant-page',

  components: {
    'app-tenant-new-form': TenantNewForm,
    'app-tenant-select-form': TenantSelectForm
  },

  data() {
    return {
      view: 'form'
    }
  },

  created() {
    if (this.invitedTenants.length) {
      this.view = 'select'
    }
  },

  computed: {
    ...mapGetters({
      invitedTenants: 'auth/invitedTenants',
      backgroundImageUrl: 'auth/backgroundImageUrl',
      logoUrl: 'auth/logoUrl'
    }),

    wrapperStyle() {
      const backgroundImageUrl =
        this.backgroundImageUrl || `/images/icon.png`

      return {
        backgroundColor: '#140505',
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: 'auto',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left 100px bottom 100px'
      }
    }
  },

  methods: {
    ...mapActions({
      doSignout: 'auth/doSignout'
    }),

    doToggleView() {
      this.view = this.view === 'form' ? 'select' : 'form'
    }
  }
}
</script>

<style></style>
