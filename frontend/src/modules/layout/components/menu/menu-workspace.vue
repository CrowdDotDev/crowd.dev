<template>
  <div>
    <el-popover
      placement="right-start"
      :width="320"
      popper-class="workspace-popover"
      :visible="isDropdownOpen"
    >
      <template #reference>
        <div class="w-full">
          <el-tooltip
            :disabled="!isCollapsed || isDropdownOpen"
            :hide-after="50"
            effect="dark"
            placement="right"
            raw-content
            popper-class="custom-workspace-menu-tooltip"
            :content="currentTenant.name"
          >
            <div
              class="cursor-pointer flex w-full min-h-16 py-2 items-center bg-white hover:bg-gray-50 account-btn"
              :class="
                isDropdownOpen ? 'bg-gray-50' : 'bg-white'
              "
              @click="isDropdownOpen = true"
            >
              <div class="flex items-center">
                <div
                  class="h-10 w-10 p-1"
                  :class="isCollapsed ? '' : 'mr-3'"
                >
                  <app-squared-avatar
                    :name="currentTenant.name"
                  />
                </div>
                <div
                  v-if="!isCollapsed"
                  class="text-sm account-btn-info"
                >
                  <div
                    class="text-gray-900 whitespace-nowrap truncate max-w-3.5xs"
                  >
                    {{ currentTenant.name }}
                  </div>
                  <div
                    class="text-gray-500 text-2xs whitespace-nowrap"
                  >
                    {{ getPlan(currentTenant.plan) }}
                    <router-link
                      :to="{
                        name: 'settings',
                        query: { activeTab: 'plans' },
                      }"
                      @click.stop
                    >
                      <span
                        v-if="getTrialDate(currentTenant)"
                        class="badge badge--xs badge--light-yellow ml-1 hover:cursor-pointer"
                      >{{
                        getTrialDate(currentTenant)
                      }}</span>
                    </router-link>
                  </div>
                </div>
              </div>

              <i
                v-if="!isCollapsed"
                class="ri-more-2-fill text-gray-300 text-lg"
              />
            </div>
          </el-tooltip>
        </div>
      </template>

      <div class="flex flex-col gap-1 mb-1">
        <!-- TODO: Check if we need permissions to access this page -->
        <div
          class="uppercase text-2xs text-gray-400 tracking-wide font-semibold pl-3 mt-1 leading-6"
        >
          Workspaces
        </div>
        <div
          v-for="tenant in tenantsList"
          :key="tenant.id"
          class="popover-item min-h-10 h-auto py-2"
          :class="
            currentTenant && currentTenant.id === tenant.id
              ? 'selected'
              : ''
          "
          @click="() => doSwitchTenant(tenant)"
        >
          <div
            class="flex grow justify-between items-center"
          >
            <div
              class="text-gray-900 text-xs w-full truncate max-w-3xs"
            >
              {{ tenant.name }}
            </div>
            <div
              class="text-gray-400 pl-3 text-2xs whitespace-nowrap flex flex-col items-end"
            >
              <span>{{ getPlan(tenant.plan) }}</span><span
                v-if="getTrialDate(tenant)"
                class="!text-yellow-600 !text-3xs"
              >{{ getTrialDate(tenant) }}</span>
            </div>
          </div>
        </div>

        <el-divider class="border-gray-200 !my-1" />

        <div
          class="popover-item"
          @click="doManageWorkspaces"
        >
          <i
            class="text-base text-gray-400 ri-list-settings-line"
          />
          <span class="text-xs text-gray-900"><app-i18n code="tenant.menu" /></span>
        </div>
      </div>
    </el-popover>
    <app-tenant-list-drawer v-model="isTenantsDrawerOpen" />
  </div>
</template>

<script setup>
import { useStore } from 'vuex';
import {
  computed, onMounted, ref, watch,
} from 'vue';
import AppTenantListDrawer from '@/modules/tenant/components/tenant-list-drawer.vue';
import config from '@/config';
import { getTrialDate } from '@/utils/date';

const store = useStore();

const isDropdownOpen = ref(false);
const isTenantsDrawerOpen = ref(false);

const currentTenant = computed(
  () => store.getters['auth/currentTenant'],
);
const tenantsList = computed(() => {
  const rows = store.getters['tenant/rows'];

  return rows.sort((x, y) => {
    if (x.name < y.name) {
      return -1;
    }
    return x.name > y.name ? 1 : 0;
  });
});

const isCollapsed = computed(
  () => store.getters['layout/menuCollapsed'],
);

onMounted(async () => {
  await store.dispatch('tenant/doFetch', {});
});

const getPlan = (plan) => {
  if (config.isCommunityVersion) {
    return 'Community';
  }

  return plan;
};

const clickOutsideListener = (event) => {
  const component = document.querySelector(
    '.workspace-popover',
  );
  if (
    // clicks outside
    !(
      component === event.target
      || component?.contains(event.target)
      // we need the following condition to validate clicks
      // on popovers that are not DOM children of this component,
      // since popper is adding fixed components to the body directly
      || event.path?.some(
        (o) => (o.className
            && typeof o.className.includes !== 'undefined'
            && o.className?.includes('el-popper'))
          || false,
      )
    )
  ) {
    isDropdownOpen.value = false;
  }
};

watch(
  isDropdownOpen,
  (newValue) => {
    setTimeout(() => {
      if (newValue) {
        document.addEventListener(
          'click',
          clickOutsideListener,
        );
      } else {
        document.removeEventListener(
          'click',
          clickOutsideListener,
        );
      }
    }, 500);
  },
  { immediate: true },
);

function doManageWorkspaces() {
  isDropdownOpen.value = false;
  isTenantsDrawerOpen.value = true;
}

async function doSwitchTenant(tenant) {
  isDropdownOpen.value = false;
  await store.dispatch('auth/doSelectTenant', { tenant });
}
</script>

<script>
export default {
  name: 'CrMenuWorkspace',
};
</script>
