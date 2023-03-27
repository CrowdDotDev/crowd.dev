<template>
  <el-popover
    placement="right-end"
    :width="230"
    trigger="hover"
    popper-class="support-popover"
    @show="isDropdownOpen = true"
    @hide="isDropdownOpen = false"
  >
    <template #reference>
      <div class="w-full">
        <div
          class="cursor-pointer flex w-full items-center bg-white hover:bg-gray-50 rounded-md"
          :class="
            isDropdownOpen ? 'bg-gray-50' : 'bg-white'
          "
        >
          <div class="el-menu-item">
            <i class="ri-question-line" />
            <span v-if="!isCollapsed">Help</span>
          </div>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-1 mb-1">
      <a aria-label="Documentation" href="https://docs.crowd.dev" target="_blank" rel="noopener noreferrer">
        <div
          class="popover-item flex grow items-center leading-none justify-between"
        >
          <div class="flex gap-2">
            <i
              class="text-base text-gray-400 ri-book-open-line"
            />
            <span class="text-xs text-gray-900">
              <app-i18n code="external.docs" /></span>
          </div>

          <i
            class="text-base ri-external-link-line text-gray-300"
          />
        </div>
      </a>

      <a aria-label="Discord" href="https://crowd.dev/discord" target="_blank" rel="noopener noreferrer">
        <div
          class="popover-item flex grow items-center leading-none justify-between"
        >
          <div class="flex gap-2">
            <app-svg
              name="discord"
              class="w-4 h-4 svg-icon"
            />
            <span class="text-xs text-gray-900">
              <app-i18n code="external.community" /></span>
          </div>

          <i
            class="text-base ri-external-link-line text-gray-300"
          />
        </div>
      </a>

      <a href="mailto:help@crowd.dev">
        <div class="popover-item">
          <div class="flex gap-2 items-center">
            <i
              class="text-base text-gray-400 ri-mail-line"
            />
            <span class="text-xs text-gray-900">Contact us</span>
          </div>
        </div>
      </a>
    </div>
  </el-popover>
</template>

<script setup>
import { useStore } from 'vuex';
import { computed, ref } from 'vue';
import AppSvg from '@/shared/svg/svg.vue';

const store = useStore();

const isDropdownOpen = ref(false);

const isCollapsed = computed(
  () => store.getters['layout/menuCollapsed'],
);
</script>

<script>
export default {
  name: 'AppWorkspaceDropdown',
};
</script>

<style lang="scss">
.support-popover {
  padding: 8px !important;
  border-radius: 8px !important;
  border: none !important;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2) !important;
  margin-left: 12px !important;
}
</style>
