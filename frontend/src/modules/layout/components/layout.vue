<template>
  <el-container>
    <app-menu></app-menu>
    <el-container :style="elMainStyle">
      <el-main class="relative">
        <banner
          v-if="currentTenant.hasSampleData"
          variant="alert"
        >
          <div
            class="flex items-center justify-center grow"
          >
            This workspace is using sample data, before
            adding real data please
            <el-button
              class="btn btn--xs btn--primary ml-4"
              :loading="loading"
              @click="handleDeleteSampleDataClick"
            >
              Delete Sample Data
            </el-button>
          </div>
        </banner>
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { TenantService } from '@/modules/tenant/tenant-service'
import { mapActions, mapGetters } from 'vuex'
import Banner from '@/shared/banner/banner.vue'
import identify from '@/shared/segment/identify'
import { i18n } from '@/i18n'

export default {
  name: 'AppLayout',

  components: {
    Banner
  },

  data() {
    return {
      fetchIntegrationTimer: null,
      loading: false
    }
  },

  computed: {
    ...mapGetters({
      collapsed: 'layout/menuCollapsed',
      isMobile: 'layout/isMobile',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      integrationsInProgress: 'integration/inProgress'
    }),
    elMainStyle() {
      if (this.isMobile && !this.collapsed) {
        return {
          display: 'none'
        }
      }

      return null
    }
  },

  created() {
    if (this.isMobile) {
      this.collapseMenu()
    }
    this.fetchIntegrationTimer = setInterval(async () => {
      if (this.integrationsInProgress.length === 0)
        clearInterval(this.fetchIntegrationTimer)
    }, 30000)
  },

  async mounted() {
    identify(this.currentUser)
  },

  unmounted() {
    clearInterval(this.fetchIntegrationTimer)
  },

  methods: {
    ...mapActions({
      collapseMenu: 'layout/collapseMenu'
    }),

    async handleDeleteSampleDataClick() {
      await this.$myConfirm(
        i18n('common.areYouSure'),
        i18n('common.confirm'),
        {
          confirmButtonText: i18n('common.yes'),
          cancelButtonText: i18n('common.no'),
          type: 'warning'
        }
      )
      this.loading = true
      await TenantService.deleteSampleData(
        this.currentTenant.id
      )
      window.location.reload()
    }
  }
}
</script>

<style></style>
