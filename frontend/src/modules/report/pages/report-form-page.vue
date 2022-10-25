<template>
  <app-page-wrapper
    :container-class="'md:col-start-1 md:col-span-6 lg:col-start-2 lg:col-span-10'"
  >
    <div
      v-if="loading.find"
      v-loading="loading.find"
      class="app-page-spinner"
    ></div>
    <div v-else>
      <div class="flex items-center justify-between">
        <router-link
          class="text-gray-600 btn-link--md btn-link--secondary p-0 flex items-center"
          :to="{ path: '/reports' }"
        >
          <i class="ri-arrow-left-s-line mr-2"></i
          >Reports</router-link
        >
        <div class="flex items-center">
          <router-link
            class="btn btn--transparent btn--md mr-4"
            :to="{
              name: 'reportView',
              params: { id: id }
            }"
            ><i class="ri-eye-line mr-2"></i>View
            report</router-link
          >
          <el-dropdown
            trigger="click"
            placement="bottom-end"
            ><el-button
              type="button"
              class="btn btn--transparent btn--md mr-4"
            >
              <i class="ri-share-line mr-2"></i>Share
            </el-button>
            <template #dropdown>
              <div class="p-4 w-100">
                <div
                  class="flex items-start justify-between"
                >
                  <div>
                    <div
                      class="font-medium text-gray-900 text-sm"
                    >
                      Publish report
                    </div>
                    <div class="text-gray-500 text-2xs">
                      Publish to web and share with everyone
                    </div>
                  </div>
                  <el-switch
                    v-model="isPublic"
                    @change="handlePublicChange"
                  />
                </div>
                <div class="mt-6 relative">
                  <div
                    v-if="!isPublic"
                    class="absolute inset-0 bg-gray-50 opacity-60 z-10 -m-6"
                  ></div>
                  <div
                    class="font-medium text-gray-900 text-sm"
                  >
                    Shareable link
                  </div>
                  <el-input
                    :value="computedPublicLink"
                    :disabled="!isPublic"
                  >
                    <template #append>
                      <el-tooltip
                        content="Copy to clipboard"
                        placement="top"
                      >
                        <el-button
                          class="append-icon"
                          @click="
                            copyPublicLinkToClipboard()
                          "
                        >
                          <i class="ri-file-copy-line"></i>
                        </el-button>
                      </el-tooltip>
                    </template>
                  </el-input>
                </div>
              </div>
            </template>
          </el-dropdown>
          <app-report-dropdown
            :report="record"
            :show-view-report="false"
            :show-view-report-public="false"
            :show-edit-report="false"
          ></app-report-dropdown>
        </div>
      </div>
      <app-report-form
        v-if="!loading.find"
        :record="record"
      />
    </div>
  </app-page-wrapper>
</template>

<script>
import AppPageWrapper from '@/modules/layout/components/page-wrapper'
import { mapActions, mapGetters } from 'vuex'
import AppReportForm from '@/modules/report/components/report-form.vue'
import AppReportDropdown from '@/modules/report/components/report-dropdown.vue'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import Message from '@/shared/message/message'

export default {
  name: 'AppReportFormPage',

  components: {
    AppPageWrapper,
    AppReportForm,
    AppReportDropdown
  },

  props: {
    id: {
      type: String,
      default: null
    }
  },

  data() {
    return {
      loading: {
        find: false,
        submit: false
      },
      isPublic: false
    }
  },

  computed: {
    ...mapGetters('report', ['find']),
    record() {
      return this.find(this.id)
    },
    computedPublicLink() {
      const tenantId = AuthCurrentTenant.get()
      return `${window.location.origin}/tenant/${tenantId}/reports/${this.record.id}/public`
    }
  },

  async created() {
    this.loading.find = true
    await this.doFind(this.id)
    this.isPublic = this.record.public
    this.loading.find = false
  },

  methods: {
    ...mapActions({
      doFind: 'report/doFind',
      doUpdate: 'report/doUpdate',
      doCreate: 'report/doCreate'
    }),

    doCancel() {
      this.$router.push('/reports')
    },

    async handlePublicChange() {
      await this.doUpdate({
        id: this.record.id,
        values: {
          public: this.isPublic
        }
      })
    },

    async copyPublicLinkToClipboard() {
      await navigator.clipboard.writeText(
        this.computedPublicLink
      )
      Message.success(
        'Report URL successfully copied to your clipboard'
      )
    }
  }
}
</script>

<style lang="scss">
.report-form-page {
  .el-form-item {
    display: block;

    &__content {
      display: block;
    }
  }
}
</style>
