<template>
  <div :class="computedClass">
    <div class="flex items-center justify-between">
      <img :src="integration.image" class="h-6 mb-4" />
      <span v-if="isDone" class="badge badge--green"
        >Connected</span
      >
      <div
        v-else-if="isConnected"
        class="flex items-center"
      >
        <div
          v-loading="true"
          class="app-page-spinner h-4 w-4 mr-2"
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
      <div class="flex items-center justify-between">
        <slot v-if="!isConnected" name="connect"></slot>
        <el-button
          v-else
          class="btn btn-brand btn-brand--bordered btn--md"
          :loading="loadingDisconnect"
          @click="handleDisconnect"
          >Disconnect</el-button
        >
        <slot name="settings"></slot>
      </div>
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

const store = useStore()
const props = defineProps({
  integration: {
    type: Object,
    default: () => {}
  },
  onboard: {
    type: Object,
    default: () => {}
  }
})

const computedClass = computed(() => {
  return {
    panel: !props.onboard
  }
})

const isConnected = computed(() => {
  return props.integration.status !== undefined
})

const isDone = computed(() => {
  return props.integration.status === 'done'
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
</script>
