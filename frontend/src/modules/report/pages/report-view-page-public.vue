<template>
  <div class="report-view-page">
    <div
      v-if="computedLoading"
      v-loading="computedLoading"
      class="app-page-spinner"
    ></div>
    <div v-else>
      <div
        class="mb-4 flex items-center flex-shrink-0 sticky top-0 inset-x-0 z-10 bg-white shadow-sm"
      >
        <div
          class="max-w-5xl flex flex-grow mx-auto items-center justify-between px-6 lg:px-8"
        >
          <div class="mb-6 mt-4">
            <div
              v-if="currentTenant.name"
              class="font-medium text-brand-500 text-sm mb-2"
            >
              {{ currentTenant.name }}
            </div>
            <h1 class="text-lg font-semibold">
              {{ report.name }}
            </h1>
          </div>
          <div
            v-if="!tenantId && !report.isTemplate"
            class="flex items-center"
          >
            <span
              class="badge mr-4"
              :class="report.public ? 'badge--green' : ''"
              >{{
                report.public ? 'Public' : 'Private'
              }}</span
            >
            <router-link
              class="btn btn--transparent btn--sm"
              :to="{ name: 'reportEdit', params: { id } }"
              ><i class="ri-pencil-line mr-2"></i
              >Edit</router-link
            >
          </div>
        </div>
      </div>
      <!-- Template report -->
      <app-page-wrapper
        v-if="report.isTemplate"
        size="narrow"
      >
        <div class="w-full mt-8">
          <app-report-member-template
            :is-public-view="true"
          />
        </div>
      </app-page-wrapper>
      <!-- Custom Report -->
      <div v-else class="max-w-5xl flex flex-grow mx-auto">
        <app-report-grid-layout
          v-model="report"
          class="-mx-4 pt-20 pb-24"
        ></app-report-grid-layout>
      </div>
      <div
        v-if="tenantId"
        class="w-full text-gray-400 text-xs flex items-center leading-none"
      >
        <div
          class="max-w-5xl flex flex-grow mx-auto items-center justify-between px-6 lg:px-8 mb-8"
        >
          <div class="flex items-center">
            <a
              href="https://www.crowd.dev/privacy-policy"
              class="text-gray-400 hover:text-brand-500"
              target="_blank"
              >Privacy Policy</a
            >
            <span class="mx-1"> · </span>
            <a
              href="https://www.crowd.dev/terms-of-use"
              class="text-gray-400 hover:text-brand-500"
              target="_blank"
            >
              Terms of Use
            </a>
            <span class="mx-1"> · </span>
            <a
              href="https://www.crowd.dev/imprint"
              class="text-gray-400 hover:text-brand-500 mr-8"
              target="_blank"
            >
              Imprint
            </a>
          </div>
          <div>
            © Crowd&nbsp;Technologies GmbH
            {{ new Date().getFullYear() }}. All rights
            reserved.
          </div>
        </div>
      </div>
      <div
        class="fixed right-6 flex items-center gap-2 bg-black rounded-full px-3 h-8 bottom-btn"
      >
        <div class="text-gray-300 text-2xs">Powered by</div>
        <a href="https://www.crowd.dev/" target="_blank">
          <img
            src="/images/logo/crowd-white.svg"
            class="block h-3.5 mb-1"
            alt="logo crowd.dev"
          />
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ReportGridLayout from '@/modules/report/components/report-grid-layout.vue'
import AppReportMemberTemplate from '@/modules/report/pages/templates/report-member-template.vue'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import { TenantService } from '@/modules/tenant/tenant-service'

export default {
  name: 'AppReportViewPage',

  components: {
    'app-report-grid-layout': ReportGridLayout,
    AppReportMemberTemplate
  },

  props: {
    id: {
      type: String,
      default: null
    },
    tenantId: {
      type: String,
      default: null
    }
  },

  data() {
    return {
      loading: false,
      currentTenant: null
    }
  },

  computed: {
    ...mapGetters({
      reportFind: 'report/find',
      reportLoading: 'report/loading'
    }),
    report() {
      return this.reportFind(this.id)
    },
    computedLoading() {
      return this.reportLoading || this.loading
    }
  },

  async created() {
    this.loading = true
    if (this.tenantId) {
      await AuthCurrentTenant.set({ id: this.tenantId })
      await this.doFindPublic({
        id: this.id,
        tenantId: this.tenantId
      })
      this.currentTenant = await TenantService.find(
        this.tenantId
      )
    } else {
      await this.doFind(this.id)
    }
    this.loading = false
  },

  methods: {
    ...mapActions({
      doFind: 'report/doFind',
      doFindPublic: 'report/doFindPublic'
    })
  }
}
</script>

<style lang="scss">
.report-view-page {
  @apply relative h-screen;
}

@media (max-width: 1362px) {
  .bottom-btn {
    @apply bottom-16;
  }
}

@media (min-width: 1362px) {
  .bottom-btn {
    @apply bottom-6;
  }
}
</style>
