<template>
  <div class="report-view-page">
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner"
    ></div>
    <div v-else>
      <div
        class="mb-4 h-16 flex items-center flex-shrink-0 fixed top-0 inset-x-0 z-10 bg-gray-50 shadow-sm"
      >
        <div
          class="lg:container col-start-2 col-span-12 flex items-center justify-between"
        >
          <h1 class="text-lg font-semibold">
            {{ report.name }}
          </h1>
          <div v-if="!tenantId" class="flex items-center">
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
      <div class="lg:container col-start-2 col-span-12">
        <app-report-grid-layout
          v-model="report"
          class="-mx-4 pt-20 pb-24"
        ></app-report-grid-layout>
      </div>
      <div
        v-if="tenantId"
        class="fixed bottom-0 inset-x-0 h-12 bg-gray-100 border-t border-gray-200 w-full text-gray-600 text-xs flex items-center leading-none flex-shrink-0"
      >
        <div
          class="lg:container flex items-center justify-between"
        >
          <div class="flex items-end">
            <div class="mr-2">Build your own with</div>
            <img
              src="/images/crowd-logo.svg"
              class="block h-4"
              alt="logo crowd.dev"
            />
          </div>
          <div class="flex items-center">
            <a
              href="https://www.crowd.dev/privacy-policy"
              class="text-gray-600 hover:text-gray-900"
              target="_blank"
              >Privacy Policy</a
            >
            <span class="mx-1"> · </span>
            <a
              href="https://www.crowd.dev/terms-of-use"
              class="text-gray-600 hover:text-gray-900"
              target="_blank"
            >
              Terms of Use
            </a>
            <span class="mx-1"> · </span>
            <a
              href="https://www.crowd.dev/imprint"
              class="text-gray-600 hover:text-gray-900 mr-8"
              target="_blank"
            >
              Imprint
            </a>
            <div>
              © Crowd&nbsp;Technologies GmbH 2022. All
              rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ReportGridLayout from '../components/report-grid-layout'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'

export default {
  name: 'AppReportViewPage',

  components: {
    'app-report-grid-layout': ReportGridLayout
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
      loading: false
    }
  },

  computed: {
    ...mapGetters({
      reportFind: 'report/find',
      loading: 'report/loading'
    }),
    report() {
      return this.reportFind(this.id)
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
</style>
