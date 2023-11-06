<template>
  <el-tooltip
    key="menu-link-quickstart"
    :disabled="!props.collapsed"
    :hide-after="50"
    content="Welcome aboard"
    effect="dark"
    placement="right"
    raw-content
  >
    <router-link
      id="menu-quickstart"
      :to="{ name: 'quickstart' }"
      class="rounded-md h-8 transition !text-gray-400 flex items-center whitespace-nowrap
          flex-nowrap px-1.5 hover:bg-gray-50 mb-2 overflow-hidden text-sm"
      active-class="!bg-gray-100 font-medium !text-gray-900"
    >
      <span class="mr-3 w-5 flex justify-center">👋</span>
      <span class="!text-gray-900">
        Welcome aboard
      </span>
    </router-link>
  </el-tooltip>
</template>

<script setup lang="ts">
const props = defineProps<{
  collapsed: boolean,
}>();
</script>

<script lang="ts">
export default {
  name: 'CrMenuQuickstart',
};
</script>
