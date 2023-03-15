<template>
  <div class="border-t border-gray-200">
    <div
      class="flex items-center gap-6 py-4 max-w-5xl mx-auto px-8"
    >
      <app-filter-list-item
        v-if="showPlatform"
        :filter="platform"
        filter-class="custom"
        @change="onPlatformChange"
        @reset="onPlatformReset"
        ><template #button
          ><div class="relative">
            <el-button
              class="custom-btn"
              @click="handleOpenPlatform"
              ><div class="flex items-center gap-2">
                <i class="ri-apps-2-line" /><span
                  class="font-medium"
                  >Platforms:
                  <span class="font-normal text-gray-600">{{
                    platformLabel
                  }}</span></span
                >
              </div></el-button
            >
            <div
              v-if="hasSelectedPlatform"
              class="w-2 h-2 rounded-full bg-brand-500 outline outline-4 outline-gray-50 absolute top-[-4px] right-[-4px]"
            ></div></div
        ></template>
        <template #optionPrefix="{ item }">
          <img
            v-if="item.value && platformOptions(item.value)"
            :src="platformOptions(item.value).image"
            class="w-4 h-4 mr-2"
          />
        </template>
      </app-filter-list-item>

      <div
        v-if="showTeamMembers"
        class="flex gap-2 items-center"
      >
        <el-switch
          class="switch-filter"
          :model-value="teamMembers"
          size="small"
          active-text="Include team members"
          @change="onTeamMembersChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import AppFilterListItem from '@/shared/filter/components/filter-list-item.vue'
import { computed, defineEmits, defineProps } from 'vue'
import { CrowdIntegrations } from '@/integrations/integrations-config'

const emit = defineEmits([
  'update:platform',
  'update:teamMembers',
  'trackFilters',
  'reset',
  'open'
])
const props = defineProps({
  platform: {
    type: Object,
    default: null
  },
  teamMembers: {
    type: Boolean,
    defaul: null
  },
  showPlatform: {
    type: Boolean,
    defaul: true
  },
  showTeamMembers: {
    type: Boolean,
    defaul: true
  }
})

const hasSelectedPlatform = computed(() => {
  return !!props.platform.value.length
})
const platformLabel = computed(() => {
  if (!hasSelectedPlatform.value) {
    return 'All'
  }

  return props.platform.value.map((v) => v.label).join(', ')
})

const onPlatformChange = (newPlatform) => {
  emit('update:platform', newPlatform)
  emit('trackFilters')
}
const onPlatformReset = () => {
  emit('reset')
  emit('trackFilters')
}
const onTeamMembersChange = (value) => {
  emit('update:teamMembers', value)
  emit('trackFilters')
}

const handleOpenPlatform = () => {
  emit('open')
}

const platformOptions = (platform) =>
  CrowdIntegrations.getConfig(platform)
</script>

<style lang="scss">
.custom-btn {
  @apply bg-white border border-gray-100 shadow text-gray-900;

  &:active,
  &:focus,
  &:hover {
    @apply bg-gray-100 text-gray-900 border-gray-100;
  }
}

.switch-filter .el-switch__label span {
  @apply text-xs text-gray-900 font-normal;
}
</style>
