<template>
  <el-popover
    :disabled="!currentTenant?.onboardedAt"
    placement="right-start"
    :width="230"
    trigger="click"
    popper-class="account-popover"
    class="h-min"
    @show="isDropdownOpen = true"
    @hide="isDropdownOpen = false"
  >
    <template #reference>
      <div
        id="accountDropdown"
        class="cursor-pointer flex w-full h-16 items-center hover:bg-gray-50 account-btn"
        :class="isDropdownOpen ? 'bg-gray-50' : 'bg-white'"
      >
        <div class="flex items-center">
          <app-avatar
            :entity="computedAvatarEntity"
            size="sm"
            :class="isCollapsed ? '' : 'mr-3'"
          />
          <div
            v-if="!isCollapsed"
            class="text-sm account-btn-info"
          >
            <div class="text-gray-900">
              {{ currentUserNameOrEmailPrefix }}
            </div>
            <div class="text-gray-500 text-2xs">
              {{ currentTenant.name }}
            </div>
          </div>
        </div>

        <i
          v-if="!isCollapsed"
          class="ri-more-2-fill text-gray-300 text-lg"
        />
      </div>
    </template>

    <!-- Popover content -->
    <div>
      <div class="popover-item" @click="doEditProfile">
        <i
          class="text-base text-gray-400 ri-account-circle-line"
        />
        <span class="text-xs text-gray-900">Profile settings</span>
      </div>
      <div
        id="logout"
        class="popover-item"
        @click="doSignout"
      >
        <i
          class="text-base text-gray-400 ri-logout-box-r-line"
        />
        <span class="text-xs text-gray-900">Sign out</span>
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import { useStore } from 'vuex';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();

const isDropdownOpen = ref(false);

const isCollapsed = computed(
  () => store.getters['layout/menuCollapsed'],
);
const currentUserNameOrEmailPrefix = computed(
  () => store.getters['auth/currentUserNameOrEmailPrefix'],
);
const currentUserAvatar = computed(
  () => store.getters['auth/currentUserAvatar'],
);
const currentTenant = computed(
  () => store.getters['auth/currentTenant'] || {},
);

const computedAvatarEntity = computed(() => ({
  avatar: currentUserAvatar.value,
  displayName: currentUserNameOrEmailPrefix.value,
}));

function doSignout() {
  store.dispatch('auth/doSignout');
}

function doEditProfile() {
  return router.push('/auth/edit-profile');
}
</script>

<script>
export default {
  name: 'AppAccountDropdown',
};
</script>

<style lang="scss">
.popover-item {
  @apply h-10 hover:cursor-pointer flex items-center gap-2 px-3 rounded hover:bg-gray-50;

  a,
  a[href]:hover {
    @apply text-gray-900;
  }

  &:hover {
    i:not(.ri-external-link-line) {
      @apply text-gray-500;
    }

    use {
      fill: #6b7280;
    }
  }
}

// Override inline style in popover
.account-popover {
  padding: 8px !important;
  transform: translateY(-10px);
  border-radius: 8px !important;
  border: none !important;
  box-shadow: 0px 1px 6px rgba(0, 0, 0, 0.2) !important;
  height: min-content !important;
}

// Smooth disappearance of account information on collapse
.app-menu {
  .account-btn {
    @apply justify-between px-3;

    &:hover .ri-more-2-fill {
      @apply text-gray-400;
    }
  }

  :not(.horizontal-collapse-transition).el-menu--collapse {
    @apply justify-center;
  }

  .horizontal-collapse-transition .account-btn-info {
    transition: opacity 0.3s ease;
    opacity: 0;
  }
}
</style>
