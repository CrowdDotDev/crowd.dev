<template>
  <el-container>
    <app-menu></app-menu>
    <el-container :style="elMainStyle">
      <el-main class="relative">
        <div :class="computedBannerWrapperClass">
          <banner
            v-if="shouldShowSampleDataAlert"
            variant="alert"
          >
            <div
              class="flex items-center justify-center grow text-sm"
            >
              This workspace is using sample data, before
              adding real data please
              <el-button
                class="btn btn--sm btn--primary ml-4"
                :loading="loading"
                @click="handleDeleteSampleDataClick"
              >
                Delete Sample Data
              </el-button>
            </div>
          </banner>
          <banner
            v-if="shouldShowIntegrationsErrorAlert"
            variant="alert"
          >
            <div
              class="flex items-center justify-center grow text-sm"
            >
              Currently you have integrations with
              connectivity issues
              <router-link
                :to="{ name: 'integration' }"
                class="btn btn--sm btn--primary ml-4"
              >
                Go to Integrations
              </router-link>
            </div>
          </banner>

          <banner
            v-if="shouldShowIntegrationsInProgressAlert"
            variant="info"
          >
            <div
              class="flex items-center justify-center grow text-sm"
            >
              <div
                v-loading="true"
                class="w-4 h-4 mr-2"
              ></div>
              <span class="font-semibold mr-1"
                >{{
                  integrationsInProgressToString
                }}
                integration{{
                  integrationsInProgress.length > 1
                    ? 's are'
                    : ' is'
                }}
                getting set up.</span
              >
              This might take a few minutes, we'll send you
              an email once it's done.
            </div>
          </banner>
          <banner
            v-if="shouldShowTenantCreatingAlert"
            variant="info"
          >
            <div
              class="flex items-center justify-center grow text-sm"
            >
              <div
                v-loading="true"
                class="w-4 h-4 mr-2"
              ></div>
              <span class="font-semibold"
                >Finishing your workspace setup.</span
              >
              The data might take a few minutes until it is
              completely loaded.
            </div>
          </banner>
        </div>
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
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'
import moment from 'moment'

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
      integrationsInProgress: 'integration/inProgress',
      integrationsWithErrors: 'integration/withErrors'
    }),
    integrationsInProgressToString() {
      const arr = this.integrationsInProgress.map(
        (i) => i.name
      )
      if (arr.length === 1) {
        return arr[0]
      } else if (arr.length === 2) {
        return `${arr[0]} and ${arr[1]}`
      } else {
        return (
          arr.slice(0, arr.length - 1).join(', ') +
          ', and ' +
          arr.slice(-1)
        )
      }
    },
    shouldShowIntegrationsInProgressAlert() {
      return this.integrationsInProgress.length > 0
    },
    shouldShowIntegrationsErrorAlert() {
      return (
        this.integrationsWithErrors.length > 0 &&
        this.$route.name !== 'integration'
      )
    },
    shouldShowSampleDataAlert() {
      return this.currentTenant.hasSampleData
    },
    shouldShowTenantCreatingAlert() {
      return (
        moment().diff(
          moment(this.currentTenant.createdAt),
          'minutes'
        ) <= 2
      )
    },
    computedBannerWrapperClass() {
      return {
        'pt-16':
          this.shouldShowSampleDataAlert ||
          this.shouldShowIntegrationsErrorAlert ||
          this.shouldShowIntegrationsInProgressAlert ||
          this.shouldShowTenantCreatingAlert
      }
    },
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
      await ConfirmDialog({
        type: 'danger',
        title: 'Delete sample data',
        message:
          "Are you sure you want to proceed? You can't undo this action",
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        icon: 'ri-delete-bin-line'
      })

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
