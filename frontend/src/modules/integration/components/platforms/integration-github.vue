<template>
  <div>
    <slot :connect="connect"></slot>
    <el-dialog
      :model-value="inProgress"
      size="600px"
      title="Finishing the setup"
    >
      <template #header>
        <div class="flex items-center h-6">
          <h5>Finishing the setup</h5>
          <div
            v-loading="true"
            class="app-page-spinner w-6 ml-4"
          ></div>
        </div>
      </template>
      <div class="p-6">
        <span>
          We're finishing the last steps of the
          <span class="font-semibold">GitHub</span>
          integration setup, please don't <br />
          reload the page.
        </span>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'AppIntegrationGithub'
}
</script>
<script setup>
import { defineProps, computed } from 'vue'
import config from '@/config'

const props = defineProps({
  integration: {
    type: Object,
    default: () => {}
  },
  onboard: {
    type: Boolean,
    default: false
  }
})

const connect = () => {
  window.open(githubConnectUrl.value, '_self')
}

const inProgress = computed(() => {
  return props.integration.status === 'in-progress'
})

const githubConnectUrl = computed(() => {
  // We have 3 GitHub apps: test, test-local and prod
  // Getting the proper URL from config file
  return config.gitHubInstallationUrl
})
</script>
