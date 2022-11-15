<template>
  <div>
    <hr class="pb-6" />
    <div class="font-semibold text-sm text-brand-500 mb-6">
      Auto Publishing
    </div>
    <el-form-item
      label="Publish from"
      prop="status"
      class="w-full"
    >
      <el-radio-group
        v-model="computedStatus"
        class="text-gray-900 text-2xs"
      >
        <el-radio label="disabled">Deactivated</el-radio>
        <el-radio label="all"
          >All channels
          <span class="text-gray-500 ml-2 font-normal"
            >All conversations will automatically be
            published</span
          ></el-radio
        >
        <el-radio label="custom"
          >Custom
          <span class="text-gray-500 ml-2 font-normal">
            Conversations from specific channels, will
            automatically be published</span
          ></el-radio
        >
      </el-radio-group>
    </el-form-item>
    <el-form-item
      v-if="computedStatus === 'custom'"
      label="Channels"
      prop="channels"
      class="w-full"
    >
      <el-select
        v-model="computedChannels"
        class="w-full"
        placeholder="Select channels"
        :filterable="true"
        :multiple="true"
      >
        <el-option
          v-for="channel in channelsList"
          :key="channel.value"
          :label="channel.label"
          :value="channel.value"
          @mouseleave="onSelectMouseLeave"
        ></el-option>
      </el-select>
    </el-form-item>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { useStore } from 'vuex'
import { onSelectMouseLeave } from '@/utils/select'

const store = useStore()
const props = defineProps({
  status: {
    type: String,
    default: null
  },
  channels: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:status',
  'update:channels'
])

const computedStatus = computed({
  get() {
    return props.status
  },
  set(value) {
    emit('update:status', value)
  }
})

const computedChannels = computed({
  get() {
    return props.channels
  },
  set(value) {
    emit('update:channels', value)
  }
})

const activeIntegrationsList = computed(
  () => store.getters['integration/activeList']
)
const channelsList = computed(() => {
  return Object.values(activeIntegrationsList.value).reduce(
    (acc, item) => {
      if (
        item.platform === 'github' &&
        item.settings.repos &&
        item.settings.repos.length > 0
      ) {
        for (const repo of item.settings.repos) {
          acc.push({
            value: `${item.platform}.${repo.name}`,
            label: `[GitHub] ${repo.name}`
          })
        }
      } else if (
        (item.platform === 'slack' ||
          item.platform === 'discord') &&
        item.settings.channels &&
        item.settings.channels.length > 0
      ) {
        for (const channel of item.settings.channels) {
          acc.push({
            value: `${item.platform}.${channel.name}`,
            label: `[${
              item.platform.charAt(0).toUpperCase() +
              item.platform.slice(1)
            }] ${channel.name}`
          })
        }
      }
      return acc
    },
    []
  )
})
</script>
