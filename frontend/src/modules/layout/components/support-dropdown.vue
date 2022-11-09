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
            <i class="ri-question-line"></i>
            <span v-if="!isCollapsed">Help & support</span>
          </div>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-1 mb-1">
      <a href="https://docs.crowd.dev" target="_blank">
        <div
          class="popover-item flex grow items-center leading-none justify-between"
        >
          <div class="flex gap-2">
            <i
              class="text-base text-gray-400 ri-book-open-line"
            ></i>
            <span class="text-xs text-gray-900">
              <app-i18n code="external.docs"></app-i18n
            ></span>
          </div>

          <i
            class="text-base ri-external-link-line text-gray-300"
          ></i>
        </div>
      </a>

      <a href="https://crowd.dev/discord" target="_blank">
        <div
          class="popover-item flex grow items-center leading-none justify-between"
        >
          <div class="flex gap-2">
            <app-svg
              name="discord"
              class="w-4 h-4 svg-icon"
            />
            <span class="text-xs text-gray-900">
              <app-i18n code="external.community"></app-i18n
            ></span>
          </div>

          <i
            class="text-base ri-external-link-line text-gray-300"
          ></i>
        </div>
      </a>

      <a href="mailto:help@crowd.dev">
        <div class="popover-item">
          <div class="flex gap-2 items-center">
            <i
              class="text-base text-gray-400 ri-mail-line"
            ></i>
            <span class="text-xs text-gray-900"
              >Contact us</span
            >
          </div>
        </div>
      </a>
    </div>
  </el-popover>
</template>

<script>
export default {
  name: 'AppWorkspaceDropdown'
}
</script>

<script setup>
import { useStore } from 'vuex'
import { computed, ref } from 'vue'
import AppSvg from '@/shared/svg/svg'

const store = useStore()

const isDropdownOpen = ref(false)

const isCollapsed = computed(
  () => store.getters['layout/menuCollapsed']
)
</script>

<style lang="scss">
.support-popover {
  padding: 8px !important;
  border-radius: 8px !important;
  border: none !important;
  box-shadow: 0px 1px 6px rgba(0, 0, 0, 0.2) !important;
  margin-left: 12px !important;
}
</style>
