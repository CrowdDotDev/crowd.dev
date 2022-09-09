<template>
  <div class="report-view-public">
    <div class="report-view-public-content">
      <div
        v-if="loading('view') || !report"
        v-loading="loading('view') || !report"
        class="app-page-spinner"
      ></div>
      <div v-else>
        <h1 class="app-content-title">
          {{ report.name }}
        </h1>
        <app-report-grid-layout
          v-model="report"
          class="-m-4"
        ></app-report-grid-layout>
      </div>
      <a
        class="crowd-watermark"
        target="_blank"
        href="https://crowd.dev"
      >
        <span class="text-black block text-sm"
          >Build your own with</span
        >
        <img
          src="/images/logo-black.png"
          alt="Crowd Logo"
          style="height: 20px"
        />
      </a>
    </div>
    <div class="report-view-public-footer">
      <div>
        <a
          href="https://www.crowd.dev/privacy-policy"
          class="text-white"
          target="_blank"
          >Privacy Policy</a
        >
        <span class="mx-1"> / </span>
        <a
          href="https://www.crowd.dev/terms-of-use"
          class="text-white"
          target="_blank"
        >
          Terms of Use
        </a>
        <span class="mx-1"> / </span>
        <a
          href="https://www.crowd.dev/imprint"
          class="text-white"
          target="_blank"
        >
          Imprint
        </a>
      </div>
      <div>
        © Crowd&nbsp;Technologies GmbH 2022. All rights
        reserved.
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ReportGridLayout from './report-grid-layout'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'

export default {
  name: 'AppReportViewPagePublic',

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
    await AuthCurrentTenant.set({ id: this.tenantId })
    await this.doFind({
      id: this.id,
      tenantId: this.tenantId
    })
  },

  methods: {
    ...mapActions({
      doFind: 'report/doFindPublic',
      setTenant: 'auth/setTenant'
    })
  }
}
</script>

<style lang="scss">
.report-view-public {
  @apply min-h-screen pb-9;

  &-content {
    @apply p-6;

    .crowd-watermark {
      @apply fixed bottom-0 right-0 mb-14 mr-6 opacity-25;
      transition: 0.2s;
      &:hover {
        @apply opacity-75;
      }
    }
  }

  &-footer {
    @apply flex items-center justify-between text-white px-6 py-2 text-sm fixed bottom-0 inset-x-0;
    background-color: #140505;
  }
}
</style>
