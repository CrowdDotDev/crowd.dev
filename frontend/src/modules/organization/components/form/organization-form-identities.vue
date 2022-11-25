<template>
  <div class="grid gap-x-12 grid-cols-3">
    <h6>Identities</h6>
    <div class="col-span-2 organization-identities-form">
      <el-form-item label="GitHub">
        <div class="flex items-center">
          <div class="platform-logo">
            <img
              :src="findPlatform('github').image"
              :alt="findPlatform('github').name"
              class="w-4 h-4"
            />
          </div>
          <div></div>
        </div>

        <el-input v-model="model.github"></el-input>
      </el-form-item>
    </div>
  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps } from 'vue'
import { CrowdIntegrations } from '@/integrations/integrations-config'

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {}
  },
  record: {
    type: Object,
    default: () => {}
  },
  showHeader: {
    type: Boolean,
    default: true
  }
})
const model = computed({
  get() {
    return props.modelValue
  },
  set(newModel) {
    emit('update:modelValue', newModel)
  }
})

function findPlatform(platform) {
  return CrowdIntegrations.getConfig(platform)
}
</script>

<style lang="scss">
.organization-identities-form {
  .platform-logo {
    @apply h-8 w-8 rounded flex items-center justify-center text-base bg-gray-100 border border-gray-200;
  }
}
</style>
