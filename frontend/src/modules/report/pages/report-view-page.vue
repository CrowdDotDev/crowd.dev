<template>
  <div class="report-view-page">
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner"
    ></div>
    <div v-else>
      <div
        class="mb-4 h-24 flex items-center flex-shrink-0 fixed top-0 inset-x-0 z-10 bg-gray-50 shadow-sm transition-all ease-in-out duration-300 justify-center"
        :style="
          menuCollapsed ? 'left: 64px' : 'left: 260px'
        "
      >
        <div class="max-w-5xl mx-5 w-full">
          <router-link
            class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center mb-2"
            :to="{ path: '/reports' }"
          >
            <i class="ri-arrow-left-s-line mr-2"></i
            >Reports</router-link
          >
          <div
            class="flex flex-grow items-center justify-between"
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
                class="btn btn--transparent btn--sm mr-4"
                :to="{ name: 'reportEdit', params: { id } }"
                ><i class="ri-pencil-line mr-2"></i
                >Edit</router-link
              >
              <app-report-dropdown
                :report="report"
                :show-edit-report="false"
                :show-view-report="false"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="max-w-5xl flex flex-grow mx-auto">
        <app-report-grid-layout
          v-model="report"
          class="-mx-4 pt-24 pb-24"
        ></app-report-grid-layout>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ReportGridLayout from '../components/report-grid-layout'
import ReportDropdown from '../components/report-dropdown'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'

export default {
  name: 'AppReportViewPage',

  components: {
    'app-report-grid-layout': ReportGridLayout,
    'app-report-dropdown': ReportDropdown
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
      menuCollapsed: 'layout/menuCollapsed',
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
