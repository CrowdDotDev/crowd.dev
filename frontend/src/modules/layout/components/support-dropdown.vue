<template>
  <el-popover
    placement="right-end"
    :width="230"
    trigger="click"
    popper-class="support-popover"
    @show="isDropdownOpen = true"
    @hide="isDropdownOpen = false"
  >
    <template #reference>
      <div class="w-full">
        <el-tooltip
          :disabled="!isCollapsed || isDropdownOpen"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-support-menu-tooltip"
          content="Support"
        >
          <div
            class="cursor-pointer flex w-full items-center bg-white hover:bg-gray-50"
            :class="
              isDropdownOpen ? 'bg-gray-50' : 'bg-white'
            "
          >
            <div class="el-menu-item">
              <i class="ri-question-line"></i>
              <span v-if="!isCollapsed"> Support</span>
            </div>
          </div>
        </el-tooltip>
      </div>
    </template>

    <div class="flex flex-col gap-1 mb-1">
      <div class="popover-item">
        <a
          class="flex grow items-center leading-none justify-between"
          href="https://docs.crowd.dev"
          target="_blank"
        >
          <div class="flex gap-2">
            <i
              class="text-base text-gray-400 ri-book-open-line"
            ></i>
            <span class="text-xs">
              <app-i18n code="external.docs"></app-i18n
            ></span>
          </div>

          <i
            class="text-base ri-external-link-line text-gray-300"
          ></i>
        </a>
      </div>

      <div class="popover-item">
        <a
          class="flex grow items-center leading-none justify-between"
          href="https://crowd.dev/discord"
          target="_blank"
        >
          <div class="flex gap-2">
            <i
              class="text-base text-gray-400 ri-discord-line"
            ></i>
            <span class="text-xs">
              <app-i18n code="external.community"></app-i18n
            ></span>
          </div>

          <i
            class="text-base ri-external-link-line text-gray-300"
          ></i>
        </a>
      </div>
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

.popover-item.selected {
  background-color: rgba(253, 237, 234, 0.5);

  & .plan {
    @apply text-brand-400;
  }
}

.custom-support-menu-tooltip {
  margin-left: -3px !important;
}
</style>
