<template>
  <div class="h-full" :class="computedClass">
    <div class="flex items-center justify-between">
      <img
        :alt="integration.name"
        :src="integration.image"
        class="h-6 mb-4"
      />
      <span v-if="isDone" class="badge badge--green"
        >Connected</span
      >
      <div
        v-else-if="isError"
        class="text-red-500 flex items-center text-sm"
      >
        <i class="ri-error-warning-line mr-1"></i> Failed to
        connect
      </div>
      <div
        v-else-if="isConnected"
        class="flex items-center"
      >
        <div
          v-loading="true"
          class="app-page-spinner !relative !min-h-4 h-4 !w-4 mr-2 !min-h-fit"
        ></div>

        <span class="text-xs text-gray-900 mr-2"
          >In progress</span
        >
        <el-tooltip
          content="Fetching first activities from an integration might take a few minutes"
          placement="top"
        >
          <i class="ri-question-line text-gray-400"></i>
        </el-tooltip>
      </div>
    </div>
    <div>
      <span class="block font-semibold leading-none mb-2">{{
        integration.name
      }}</span>
      <span class="block mb-6 text-xs text-gray-500">{{
        integration.description
      }}</span>
      <a
        v-if="isError"
        href="https://crowd.dev/discord"
        target="__blank"
      >
        <el-button
          class="btn btn--bordered"
          :loading="loadingDisconnect"
          >Contact us</el-button
        ></a
      >

      <app-integration-connect
        v-if="!isError"
        :integration="integration"
      >
        <template
          #default="{
            connect,
            connected,
            settings,
            hasSettings
          }"
        >
          <div class="flex items-center justify-between">
            <a
              v-if="!connected"
              class="btn btn--secondary btn--md"
              @click="connect"
              >Connect</a
            >
            <el-button
              v-else
              class="btn btn-brand btn-brand--bordered btn--md"
              :loading="loadingDisconnect"
              @click="handleDisconnect"
              >Disconnect</el-button
            >
            <el-button
              v-if="connected && hasSettings"
              class="btn btn--transparent btn--md"
              @click="settings"
              ><i class="ri-settings-2-line mr-2"></i
              >Settings</el-button
            >
          </div>
        </template>
      </app-integration-connect>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppIntegrationListItem'
}
</script>
<script setup>
import { useStore } from 'vuex'
import { defineProps, computed, ref } from 'vue'
import AppIntegrationConnect from '@/modules/integration/components/integration-connect'

const store = useStore()
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

const computedClass = computed(() => {
  return {
    panel: !props.onboard,
    'integration-custom':
      props.integration.platform === 'custom'
  }
})

const isConnected = computed(() => {
  return props.integration.status !== undefined
})

const isDone = computed(() => {
  return props.integration.status === 'done'
})

const isError = computed(() => {
  return props.integration.status === 'error'
})

const loadingDisconnect = ref(false)

const handleDisconnect = async () => {
  loadingDisconnect.value = true
  await store.dispatch(
    'integration/doDestroy',
    props.integration.id
  )
  loadingDisconnect.value = false
}

const fetchIntegrationInProgress = async () => {
  if (
    props.integration.status &&
    props.integration.status === 'in-progress'
  ) {
    await store.dispatch(
      'integration/doFind',
      props.integration.id
    )
  } else {
    clearInterval(integrationInProgressInterval)
  }
}

const integrationInProgressInterval = setInterval(
  fetchIntegrationInProgress,
  10000
)
</script>
<style lang="scss">
.integration-custom {
  background: linear-gradient(
      117.72deg,
      #fdedea 0%,
      rgba(253, 237, 234, 0) 100%
    ),
    #ffffff;
}
</style>
