<template>
  <app-drawer
    v-model="isDrawerOpen"
    custom-class="attributes-drawer"
    title="Manage global attributes"
    size="35%"
    :show-footer="false"
  >
    <template #content
      ><app-member-form-global-attributes
        v-model="isDrawerOpen"
    /></template>
  </app-drawer>
</template>

<script setup>
import AppMemberFormGlobalAttributes from './form/member-form-global-attributes'
import { defineProps, defineEmits, computed } from 'vue'

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: () => false
  }
})

const isDrawerOpen = computed({
  get() {
    return props.modelValue
  },
  set(drawerVisibility) {
    emit('update:modelValue', drawerVisibility)
  }
})
</script>

<style lang="scss">
.attributes-drawer {
  & .el-drawer__header {
    @apply p-6;
  }

  & .el-drawer__body {
    @apply p-0;
  }

  & .el-drawer__footer {
    @apply w-full p-6 border-t border-gray-200;
  }

  & .attribute-type {
    width: 100px;
  }

  & .el-form-item,
  .el-form .el-form-item__content {
    @apply mb-0;
  }
}
</style>
