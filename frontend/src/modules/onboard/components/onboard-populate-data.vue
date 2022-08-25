<template>
  <transition name="fade" mode="out-in">
    <div class="panel" v-if="showPicker">
      <span class="text-gray-800 block mb-6"
        >Please select one of the following options:</span
      >
      <div class="flex items-center justify-between -mx-4">
        <div
          class="data-type-option"
          :class="
            selectedDataType === 'sample'
              ? 'border-primary-900'
              : 'border-gray-50 hover:border-gray-400'
          "
          @click="selectedDataType = 'sample'"
        >
          <img
            src="/images/sample-data.svg"
            alt=""
            class="w-88 mb-8"
          />

          <div class="font-semibold">
            Kickstart with sample-data
          </div>
        </div>
        <div
          class="data-type-option"
          @click="selectedDataType = 'real'"
          :class="
            selectedDataType === 'real'
              ? 'border-primary-900'
              : 'border-gray-50 hover:border-gray-400'
          "
        >
          <img
            src="/images/real-data.svg"
            alt=""
            class="w-88 mt-6 mb-8"
          />
          <div class="font-semibold">
            Use real-data and set up integrations
          </div>
        </div>
      </div>
      <el-button
        class="btn btn--primary btn--xl w-full mt-12"
        :disabled="!selectedDataType"
        :loading="loading"
        @click="handlePickerSubmit"
      >
        {{
          selectedDataType === 'sample'
            ? 'Populate workspace with sample-data'
            : 'Continue to Integrations setup'
        }}</el-button
      >
    </div>
    <div class="content panel" v-else>
      <button
        class="text-gray-400 hover:text-black flex items-center"
        @click="showPicker = true"
      >
        <i class="ri-arrow-left-line mr-1 ri-lg"></i
        ><span class="block">Back</span>
      </button>
      <app-integration-list :onboard="true" />
      <el-button
        class="btn btn--primary btn--xl w-full mt-12"
        :disabled="integrationsCount === 0"
        :loading="loading"
        @click="handleIntegrationsSubmit"
      >
        Go to Dashboard
        <i class="ri-arrow-right-line ri-lg ml-1"></i>
      </el-button>
    </div>
  </transition>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import AppIntegrationList from '../../integration/components/integration-list'
import { TenantService } from '../../tenant/tenant-service'

export default {
  name: 'onboard-populate-data',
  components: { AppIntegrationList },
  data() {
    return {
      showPicker: true,
      selectedDataType: null,
      loading: false
    }
  },
  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      integrationsCount: 'integration/count'
    }),

    wrapperStyle() {
      return {
        backgroundColor: '#140505'
      }
    }
  },
  created() {
    if (
      this.$route.query.selectedDataType ||
      this.$route.query.activeTab === 'integrations'
    ) {
      this.selectedDataType =
        this.$route.query.selectedDataType || 'real'
      this.showPicker = false
    }
  },
  methods: {
    ...mapActions({
      doFinishOnboard: 'auth/doFinishOnboard'
    }),
    async handlePickerSubmit() {
      if (this.selectedDataType === 'sample') {
        this.loading = true
        await TenantService.populateSampleData(
          this.currentTenant.id
        )
        await this.doFinishOnboard()
      } else {
        this.showPicker = false
      }
    },
    async handleIntegrationsSubmit() {
      this.loading = true
      await this.doFinishOnboard()
    }
  }
}
</script>
