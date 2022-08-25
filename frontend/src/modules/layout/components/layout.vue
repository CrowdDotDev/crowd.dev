<template>
  <div>
    <el-container>
      <app-menu></app-menu>
      <el-container :style="elMainStyle">
        <el-main class="relative">
          <banner
            variant="alert"
            v-if="currentTenant.hasSampleData"
          >
            <div
              class="flex items-center justify-center flex-grow"
            >
              This workspace is using sample data, before
              adding real data please
              <el-button
                class="btn btn--xs btn--primary ml-4"
                @click="handleDeleteSampleDataClick"
                :loading="loading"
              >
                Delete Sample Data
              </el-button>
            </div>
          </banner>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { TenantService } from '@/modules/tenant/tenant-service'
import { mapActions, mapGetters } from 'vuex'
import Banner from '@/shared/banner/banner.vue'
import identify from '@/shared/segment/identify'
import LogRocket from 'logrocket'
import { i18n } from '@/i18n'

export default {
  name: 'app-layout',

  components: {
    Banner
  },

  async mounted() {
    identify(this.currentUser)
    // This is an example script - don't forget to change it!

    if (process.env.NODE_ENV === 'production') {
      LogRocket.identify(this.currentUser.id, {
        name: this.currentUser.fullName,
        email: this.currentUser.email
      })
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

      if (this.collapsed) {
        return {
          marginLeft: '64px'
        }
      } else if (!this.collapsed) {
        return {
          marginLeft: '210px'
        }
      }
      return null
    }
  },

  data() {
    return {
      fetchIntegrationTimer: null,
      loading: false
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

  destroyed() {
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
