<template>
  <el-aside class="app-menu" width="fit-content">
    <el-menu
      class="flex flex-col h-full border-none"
      :router="true"
    >
      <div class="px-3 pt-3 flex flex-col gap-2 grow">
        <!-- All project groups -->
        <router-link
          id="menu-project-groups"
          :to="{ path: '/project-groups' }"
          class="el-menu-item"
          :class="classFor('/project-groups', true)"
        >
          <i class="ri-list-check" />
          <span>
            All project groups
          </span>
        </router-link>

        <div class="my-3">
          <app-lf-menu-project-group-selection />
        </div>

        <!-- Dashboard -->
        <router-link
          id="menu-dashboard"
          :to="{ path: '/' }"
          class="el-menu-item"
          :class="classFor('/', true, !selectedProjectGroup)"
          :disabled="!selectedProjectGroup"
        >
          <i class="ri-home-5-line" />
          <span>
            Overview
          </span>
        </router-link>

        <!-- Members -->
        <router-link
          id="menu-members"
          :to="{ path: '/contributors' }"
          class="el-menu-item"
          :class="classFor('/contributors', false, !selectedProjectGroup)"
          :disabled="!selectedProjectGroup"
        >
          <i class="ri-group-2-line" />
          <span>
            Contributors
          </span>
        </router-link>

        <!-- Organizations -->
        <router-link
          id="menu-organizations"
          :to="{ path: '/organizations' }"
          class="el-menu-item"
          :class="classFor('/organizations', false, !selectedProjectGroup)"
          :disabled="!selectedProjectGroup"
        >
          <i class="ri-community-line" />
          <span>
            Organizations
          </span>
        </router-link>

        <!-- Activities -->
        <router-link
          id="menu-activities"
          :to="{ path: '/activities' }"
          class="el-menu-item"
          :class="classFor('/activities', false, !selectedProjectGroup)"
          :disabled="!selectedProjectGroup"
        >
          <i class="ri-radar-line" />
          <span>
            Activities
          </span>
        </router-link>

        <!-- Reports -->
        <router-link
          id="menu-reports"
          :to="{ path: '/reports' }"
          class="el-menu-item"
          :class="classFor('/reports', false, !selectedProjectGroup)"
          :disabled="!selectedProjectGroup"
        >
          <i class="ri-bar-chart-line" />
          <span>
            Reports
          </span>
        </router-link>

        <div class="grow" />

        <!-- Eagle eye -->
        <router-link
          v-if="
            hasPermissionToEagleEye || isEagleEyeLocked
          "
          id="menu-eagle-eye"
          :to="{ path: '/community-lens' }"
          class="el-menu-item"
          :class="classFor('/community-lens')"
        >
          <i class="ri-search-eye-line" />
          <span>
            Community Lens
          </span>
        </router-link>

        <el-divider
          v-if="hasPermissionToSettings || isSettingsLocked || hasPermissionToAccessAdminPanel"
          class="border-gray-200 !mb-1"
        />

        <div class="mb-6">
          <router-link
            v-if="
              hasPermissionToSettings || isSettingsLocked
            "
            id="menu-settings"
            :to="{ path: '/settings' }"
            class="el-menu-item mb-2"
            :class="classFor('/settings')"
          >
            <i class="ri-settings-3-line" />
            <span>
              Settings
            </span>
          </router-link>

          <router-link
            v-if="hasPermissionToAccessAdminPanel"
            id="menu-admin-panel"
            :to="{ path: '/admin/project-groups' }"
            class="el-menu-item"
            :class="classFor('/admin/project-groups')"
          >
            <i class="ri-settings-3-line" />
            <span>
              Admin panel
            </span>
          </router-link>
        </div>
      </div>

      <app-account-dropdown />
    </el-menu>
  </el-aside>
</template>

<script setup>
import { watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import AppLfMenuProjectGroupSelection from '@/modules/lf/layout/components/lf-menu-project-group-selection.vue';
import AppAccountDropdown from '@/modules/layout/components/account-dropdown.vue';
import { ActivityTypeService } from '@/modules/activity/services/activity-type-service';
import { EagleEyePermissions } from '@/premium/eagle-eye/eagle-eye-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { SettingsPermissions } from '@/modules/settings/settings-permissions';
import { LfPermissions } from '@/modules/lf/lf-permissions';

const { currentTenant, currentUser } = mapGetters('auth');

const { setTypes } = useActivityTypeStore();

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

watch(
  selectedProjectGroup,
  (updatedProjectGroup) => {
    if (updatedProjectGroup) {
      ActivityTypeService.get().then((response) => {
        setTypes(response);
      });
    }
  },
  { immediate: true, deep: true },
);

// @ts-ignore
const route = useRoute();

const classFor = (path, exact = false, disabled = false) => {
  if (exact) {
    return {
      'pointer-events-none': disabled,
      'is-active': route.path === path,
    };
  }

  const routePath = route.path;
  const active = routePath === path || routePath.startsWith(`${path}/`);

  return {
    'pointer-events-none': disabled,
    'is-active': active,
  };
};

const hasPermissionToEagleEye = computed(
  () => new EagleEyePermissions(
    currentTenant.value,
    currentUser.value,
  ).read,
);

const isEagleEyeLocked = computed(
  () => new EagleEyePermissions(
    currentTenant.value,
    currentUser.value,
  ).lockedForCurrentPlan,
);

const hasPermissionToSettings = computed(
  () => new SettingsPermissions(
    currentTenant.value,
    currentUser.value,
  ).edit,
);

const isSettingsLocked = computed(
  () => new SettingsPermissions(
    currentTenant.value,
    currentUser.value,
  ).lockedForCurrentPlan,
);

const hasPermissionToAccessAdminPanel = computed(
  () => new LfPermissions(
    currentTenant.value,
    currentUser.value,
  ).createProjectGroup,
);

</script>

<script>
export default {
  name: 'LfMenu',
};
</script>

  <style lang="scss">
  .app-menu {
    @apply w-70 bg-brand-25 flex flex-col;

    .el-menu {
      @apply bg-brand-25;
    }

    a,
    a[href]:hover {
      @apply text-gray-900;
    }

    // Menu item
    .el-menu-item {
      @apply px-2.5 h-9 gap-3 leading-normal rounded-full;

      i {
        @apply text-gray-900 text-lg leading-none;
      }

      &.is-active {
        @apply bg-brand-50 text-gray-900 font-medium;

        i {
          @apply text-gray-900;
        }
      }

      &[disabled="true"] {
        @apply opacity-35;
      }

      &:hover {
        @apply bg-gray-200;

        i {
          @apply text-gray-900;
        }
      }
    }

    // Override divider margin
    .el-divider--horizontal {
      @apply my-1;
    }

    // Custom Menu items
    .item-link {
      display: none;
    }

    .custom-menu-item:hover {
      .item-link {
        display: block;
      }
    }
    .custom-btn {
      @apply h-8 w-8;

      &:hover i {
        @apply text-gray-500;
      }
    }
    a[href]:hover {
      opacity: 1;
    }
  }
  </style>
