<template>
  <el-container>
    <app-menu></app-menu>
    <el-container :style="elMainStyle">
      <el-main id="main-page-wrapper" class="relative">
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
              Sit back and relax. We will send you an email
              when it’s done.
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
          <banner
            v-if="shouldShowPMFSurveyAlert"
            variant="info"
          >
            <div
              class="flex items-center justify-center grow text-sm"
            >
              <div class="flex-1"></div>
              <div class="">
                Could you help us by answering a quick
                survey? 😄
                <button
                  :data-tf-popup="typeformData.id"
                  :data-tf-iframe-props="`title=${typeformData.title}`"
                  data-tf-medium="snippet"
                  class="btn btn--sm btn--primary ml-4"
                  @click="hideTypeform()"
                >
                  Take survey
                </button>
              </div>
              <div class="flex-1">
                <div class="w-20 ml-auto">
                  <button @click="hideTypeform()">
                    <i
                      class="ri-close-line text-gray-700"
                    ></i>
                  </button>
                </div>
              </div>
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
import identify from '@/shared/monitoring/identify'
import ConfirmDialog from '@/shared/dialog/confirm-dialog.js'
import moment from 'moment'
import config from '@/config'

export default {
  name: 'AppLayout',

  components: {
    Banner
  },

  data() {
    return {
      fetchIntegrationTimer: null,
      loading: false,
      hideTypeformBanner: localStorage.getItem(
        `hideTypeformBanner-${config.typeformId}`
      ),
      typeformData: {
        id: config.typeformId,
        title: config.typeformTitle
      }
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
    shouldShowPMFSurveyAlert() {
      return (
        config.typeformId &&
        config.typeformTitle &&
        !this.hideTypeformBanner
      )
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
          this.shouldShowTenantCreatingAlert ||
          this.shouldShowPMFSurveyAlert
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
    let recaptchaScript = document.createElement('script')
    recaptchaScript.setAttribute(
      'src',
      '//embed.typeform.com/next/embed.js'
    )
    document.head.appendChild(recaptchaScript)
  },

  unmounted() {
    clearInterval(this.fetchIntegrationTimer)
  },

  methods: {
    ...mapActions({
      collapseMenu: 'layout/collapseMenu'
    }),

    hideTypeform() {
      this.hideTypeformBanner = true
      localStorage.setItem(
        `hideTypeformBanner-${config.typeformId}`,
        true
      )
    },

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
