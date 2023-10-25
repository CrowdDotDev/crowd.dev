<template>
  <el-popover
    placement="right-end"
    :width="260"
    trigger="click"
    popper-class="!pt-2 !px-1 pb-1"
    @show="isDropdownOpen = true"
    @hide="isDropdownOpen = false"
  >
    <template #reference>
      <div
        class="rounded-md h-8 transition !text-gray-400 flex items-center whitespace-nowrap flex-nowrap px-1.5 hover:bg-gray-100 cursor-pointer"
        :class="isDropdownOpen ? 'bg-gray-100' : ''"
      >
        <i class="ri-question-line text-lg mr-4" />
        <span v-if="!props.collapsed" class="text-sm !text-gray-900">
          Help & support
        </span>
      </div>
    </template>

    <div class="">
      <div class="pt-1 pb-2 px-4">
        <p class="uppercase text-2xs font-semibold tracking-1 text-gray-400">
          Help & Support
        </p>
      </div>
      <cr-menu-links
        :collapsed="false"
        :links="supportMenu"
        link-class="!p-3 !h-10 !mb-1 !text-xs"
      />
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CrMenuLinks from '@/modules/layout/components/menu/menu-links.vue';
import { supportMenu } from '@/modules/layout/config/menu';

const props = defineProps<{
  collapsed: true
}>();

const isDropdownOpen = ref<boolean>(false);
</script>

<script lang="ts">
export default {
  name: 'CrMenuSupport',
};
</script>
