<template>
  <div>
    <div v-if="count > 0">
      <div class="flex items-center justify-between mt-6">
        <div class="text-gray-600 text-sm">
          {{ count }} webhooks
        </div>
        <div>
          <el-button
            class="btn btn--primary"
            @click="newAutomationModal = true"
          >
            <i class="ri-lg ri-add-line mr-1"></i>
            New webhook
          </el-button>
        </div>
      </div>
      <app-automation-list-table />
    </div>
    <div
      v-else
      class="flex flex-col items-center justify-center pt-20 pb-10"
    >
      <img
        src="/images/automations-empty-state.svg"
        alt=""
        class="w-80"
      />
      <div class="text-xl font-medium mt-10">
        Start to automate manual tasks
      </div>
      <div class="text-gray-600 text-sm mt-6">
        Create webhook actions for when a new activity
        happens, or a new member joins your community
      </div>
      <el-button
        class="btn btn--primary mt-10"
        @click="newAutomationModal = true"
      >
        <i class="ri-lg ri-add-line mr-1"></i>
        New webhook
      </el-button>
    </div>
    <el-dialog
      v-model="newAutomationModal"
      title="New webhook"
      :destroy-on-close="true"
      custom-class="el-dialog--lg"
      @close="newAutomationModal = false"
    >
      <app-automation-form v-model="newAutomation" />
    </el-dialog>
  </div>
</template>

<script>
import AppAutomationListTable from './automation-list-table'
import AppAutomationForm from './automation-form'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'AppAutomationListPage',
  components: {
    AppAutomationListTable,
    AppAutomationForm
  },
  data() {
    return {
      newAutomation: {
        type: 'webhook'
      },
      newAutomationModal: false
    }
  },
  computed: {
    ...mapGetters({
      count: 'automation/count'
    })
  },
  async created() {
    await this.doFetch()
  },
  methods: {
    ...mapActions({
      doFetch: 'automation/doFetch'
    })
  }
}
</script>
