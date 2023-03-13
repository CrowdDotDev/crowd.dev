<template>
  <el-container>
    <app-menu></app-menu>
    <el-container :style="elMainStyle">
      <el-main id="main-page-wrapper" class="relative">
        <div
          :class="{
            'pt-14': showBanner
          }"
        >
          <banner
            v-if="showSampleDataAlert"
            variant="alert"
          >
            <div
              class="flex items-center justify-center grow text-sm"
            >
              This workspace is using sample data. Connect
              your first integration to start fetching real
              data
              <router-link :to="{ name: 'integration' }">
                <el-button
                  class="btn btn--sm btn--primary ml-4"
                  :loading="loading"
                >
                  Connect integration
                </el-button>
              </router-link>
            </div>
          </banner>
          <banner
            v-if="showIntegrationsErrorAlert"
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
            v-if="showIntegrationsNoDataAlert"
            variant="alert"
          >
            <div
              class="flex items-center justify-center grow text-sm"
            >
              Currently you have integrations that are not
              receiving activities
              <router-link
                :to="{ name: 'integration' }"
                class="btn btn--sm btn--primary ml-4"
              >
                Go to Integrations
              </router-link>
            </div>
          </banner>

          <banner
            v-if="showIntegrationsInProgressAlert"
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
          <banner v-if="showPMFSurveyAlert" variant="info">
            <div
              class="flex items-center justify-center grow text-sm"
            >
              <div class="flex-1"></div>
              <div class="">
                Do you have 1 minute to help us improve
                crowd.dev for you? 😊
                <button
                  data-tf-medium="snippet"
                  class="btn btn--sm btn--primary ml-4"
                  @click="toggleShowPmfSurvey()"
                >
                  Take survey
                </button>
              </div>
              <div class="flex-1">
                <div class="w-20 ml-auto">
                  <button @click="doHidePmfBanner()">
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
  <!-- PMF Modal -->
  <div
    v-show="showPmfSurvey"
    class="relative z-30"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
    ></div>

    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div
        class="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0"
      >
        <div
          class="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6 w-96"
          @click="(e) => e.stopPropagation()"
        >
          <button
            class="absolute right-3 top-3"
            @click="toggleShowPmfSurvey()"
          >
            <i class="ri-close-line text-gray-700"></i>
          </button>
          <div id="formbricks-pmf-container"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useStore } from 'vuex'
import { mapActions, mapGetters } from 'vuex'
import Banner from '@/shared/banner/banner.vue'
import identify from '@/shared/monitoring/identify'
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
      showPmfSurvey: false
    }
  },

  computed: {
    ...mapGetters({
      collapsed: 'layout/menuCollapsed',
      isMobile: 'layout/isMobile',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      integrationsInProgress: 'integration/inProgress',
      integrationsWithErrors: 'integration/withErrors',
      integrationsWithNoData: 'integration/withNoData',
      showSampleDataAlert: 'tenant/showSampleDataAlert',
      showIntegrationsErrorAlert:
        'tenant/showIntegrationsErrorAlert',
      showIntegrationsNoDataAlert:
        'tenant/showIntegrationsNoDataAlert',
      showIntegrationsInProgressAlert:
        'tenant/showIntegrationsInProgressAlert',
      showPMFSurveyAlert: 'tenant/showPMFSurveyAlert',
      showBanner: 'tenant/showBanner'
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
    elMainStyle() {
      if (this.isMobile && !this.collapsed) {
        return {
          display: 'none'
        }
      }

      return null
    }
  },

  watch: {
    // whenever question changes, this function will run
    showPmfSurvey(newValue) {
      if (newValue) {
        setTimeout(() => {
          window.formbricksPmf.init()
          window.formbricksPmf.reset()
        }, 10)
      }
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
    const store = useStore()
    identify(this.currentUser)
    this.initPendo()
    // formbricks pmf
    if (
      config.formbricks.url &&
      config.formbricks.pmfFormId
    ) {
      window.formbricksPmf = {
        ...window.formbricksPmf,
        config: {
          formbricksUrl: config.formbricks.url,
          formId: config.formbricks.pmfFormId,
          containerId: 'formbricks-pmf-container',
          onFinished: () => this.doHidePmfBanner(),
          contact: {
            name: 'Jonathan',
            position: 'Co-Founder',
            imgUrl:
              'https://avatars.githubusercontent.com/u/41432658?v=4'
          },
          customer: {
            id: store.getters['auth/currentUser'].id,
            name: store.getters['auth/currentUser']
              .fullName,
            email: store.getters['auth/currentUser'].email
          },
          style: {
            brandColor: '#e94f2e',
            headerBGColor: '#F9FAFB',
            boxBGColor: '#ffffff',
            textColor: '#140505',
            buttonHoverColor: '#F9FAFB'
          }
        }
      }
      require('@formbricks/pmf')
    }
  },

  unmounted() {
    clearInterval(this.fetchIntegrationTimer)
  },

  methods: {
    ...mapActions({
      collapseMenu: 'layout/collapseMenu',
      doHidePmfBanner: 'tenant/doHidePmfBanner'
    }),

    toggleShowPmfSurvey() {
      this.showPmfSurvey = !this.showPmfSurvey
      if (this.showPmfSurvey) {
        window.formbricksPmf.init()
        window.formbricksPmf.reset()
      }
    },

    initPendo() {
      // This function creates anonymous visitor IDs in Pendo unless you change the visitor id field to use your app's values
      // This function uses the placeholder 'ACCOUNT-UNIQUE-ID' value for account ID unless you change the account id field to use your app's values
      // Call this function in your authentication promise handler or callback when your visitor and account id values are available
      // Please use Strings, Numbers, or Bools for value types.
      window.pendo.initialize({
        visitor: {
          id: this.currentUser.id, // Required if user is logged in, default creates anonymous ID
          email: this.currentUser.email, // Recommended if using Pendo Feedback, or NPS Email
          full_name: this.currentUser.fullName // Recommended if using Pendo Feedback
          // role:         // Optional

          // You can add any additional visitor level key-values here,
          // as long as it's not one of the above reserved names.
        },

        account: {
          id: this.currentTenant.id, // Required if using Pendo Feedback, default uses the value 'ACCOUNT-UNIQUE-ID'
          name: this.currentTenant.name, // Optional
          is_paying: this.currentTenant.plan !== 'Essential' // Recommended if using Pendo Feedback
          // monthly_value:// Recommended if using Pendo Feedback
          // planLevel:    // Optional
          // planPrice:    // Optional
          // creationDate: // Optional

          // You can add any additional account level key-values here,
          // as long as it's not one of the above reserved names.
        }
      })
    }
  }
}
</script>

<style></style>
