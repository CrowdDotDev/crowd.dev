<template>
  <el-aside
    class="app-menu"
    width="fit-content"
  >
    <el-menu
      class="flex flex-col h-full border-none"
      :collapse="isCollapsed"
      :router="true"
    >
      <div class="px-4 pt-3 flex flex-col gap-2 grow">
        <!-- All project groups -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          content="All project groups"
        >
          <router-link
            id="menu-project-groups"
            :to="{ path: '/project-groups' }"
            class="el-menu-item"
            :class="classFor('/project-groups', true)"
          >
            <i class="ri-list-check" />
            <span v-if="!isCollapsed">
              All project groups
            </span>
          </router-link>
        </el-tooltip>

        <div class="my-3">
          <app-lf-menu-project-group-selection
            v-if="!isCollapsed"
          />
          <el-divider v-else class="!mt-1 !mb-0" />
        </div>

        <!-- Dashboard -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          content="Overview"
        >
          <router-link
            id="menu-dashboard"
            :to="{
              path: '/',
              query: { projectGroup: selectedProjectGroup?.id },
            }"
            class="el-menu-item"
            :class="classFor('/', true, !selectedProjectGroup)"
            :disabled="!selectedProjectGroup"
          >
            <i class="ri-home-5-line" />
            <span v-if="!isCollapsed">
              Overview
            </span>
          </router-link>
        </el-tooltip>

        <!-- Members -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          content="Contributors"
        >
          <router-link
            id="menu-members"
            :to="{
              path: '/contributors',
              query: { projectGroup: selectedProjectGroup?.id },
            }"
            class="el-menu-item"
            :class="classFor('/contributors', false, !selectedProjectGroup)"
            :disabled="!selectedProjectGroup"
          >
            <i class="ri-group-2-line" />
            <span v-if="!isCollapsed">
              Contributors
            </span>
          </router-link>
        </el-tooltip>

        <!-- Organizations -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          content="Organizations"
        >
          <router-link
            id="menu-organizations"
            :to="{
              path: '/organizations',
              query: { projectGroup: selectedProjectGroup?.id },
            }"
            class="el-menu-item"
            :class="classFor('/organizations', false, !selectedProjectGroup)"
            :disabled="!selectedProjectGroup"
          >
            <i class="ri-community-line" />
            <span v-if="!isCollapsed">
              Organizations
            </span>
          </router-link>
        </el-tooltip>

        <!-- Activities -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          content="Activities"
        >
          <router-link
            id="menu-activities"
            :to="{
              path: '/activities',
              query: { projectGroup: selectedProjectGroup?.id },
            }"
            class="el-menu-item"
            :class="classFor('/activities', false, !selectedProjectGroup)"
            :disabled="!selectedProjectGroup"
          >
            <i class="ri-radar-line" />
            <span v-if="!isCollapsed">
              Activities
            </span>
          </router-link>
        </el-tooltip>

        <!-- Reports -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          content="Reports"
        >
          <router-link
            id="menu-reports"
            :to="{
              path: '/reports',
              query: { projectGroup: selectedProjectGroup?.id },
            }"
            class="el-menu-item"
            :class="classFor('/reports', false, !selectedProjectGroup)"
            :disabled="!selectedProjectGroup"
          >
            <i class="ri-bar-chart-line" />
            <span v-if="!isCollapsed">
              Reports
            </span>
          </router-link>
        </el-tooltip>

        <div class="grow" />

        <!-- Eagle eye -->
        <el-tooltip
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          content="Community Lens"
        >
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
            <span v-if="!isCollapsed">
              Community Lens
            </span>
          </router-link>
        </el-tooltip>

        <el-divider
          v-if="hasPermissionToSettings || isSettingsLocked || hasPermissionToAccessAdminPanel"
          class="border-gray-200 !mb-1"
        />

        <div class="mb-6">
          <el-tooltip
            :disabled="!isCollapsed"
            :hide-after="50"
            effect="dark"
            placement="right"
            raw-content
            popper-class="custom-menu-tooltip"
            content="Settings"
          >
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
              <span v-if="!isCollapsed">
                Settings
              </span>
            </router-link>
          </el-tooltip>

          <el-tooltip
            :disabled="!isCollapsed"
            :hide-after="50"
            effect="dark"
            placement="right"
            raw-content
            popper-class="custom-menu-tooltip"
            content="Admin panel"
          >
            <router-link
              v-if="hasPermissionToAccessAdminPanel"
              id="menu-admin-panel"
              :to="{ path: '/admin/project-groups' }"
              class="el-menu-item"
              :class="classFor('/admin/project-groups')"
            >
              <i class="ri-settings-3-line" />
              <span v-if="!isCollapsed">
                Admin panel
              </span>
            </router-link>
          </el-tooltip>
        </div>
      </div>
    </el-menu>
    <div
      class="absolute bg-gray-600 right-0 rounded-l-md h-8 w-6 flex items-center justify-center bottom-48 cursor-pointer hover:bg-gray-700"
      @click="toggleMenu"
    >
      <i
        class="text-white"
        :class="{
          'ri-arrow-left-double-fill': !isCollapsed,
          'ri-arrow-right-double-fill': isCollapsed,
        }"
      />
    </div>
  </el-aside>
</template>

<script setup>
import { watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import AppLfMenuProjectGroupSelection from '@/modules/lf/layout/components/lf-menu-project-group-selection.vue';
import { ActivityTypeService } from '@/modules/activity/services/activity-type-service';
import { EagleEyePermissions } from '@/premium/eagle-eye/eagle-eye-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { SettingsPermissions } from '@/modules/settings/settings-permissions';
import { LfPermissions } from '@/modules/lf/lf-permissions';
import { useStore } from 'vuex';

const store = useStore();

const { currentTenant, currentUser } = mapGetters('auth');
const { menuCollapsed: isCollapsed } = mapGetters('layout');

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

function toggleMenu() {
  store.dispatch('layout/toggleMenu');
}

</script>

<script>
export default {
  name: 'LfMenu',
};
</script>

  <style lang="scss">

  .app-menu {
    --el-menu-base-level-padding: 24px;
    @apply bg-brand-25 flex flex-col relative;

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

    // Menu width and padding customization
  .el-menu--vertical:not(.el-menu--collapse):not(.el-menu--popup-container) {
    @apply w-70;

    .menu-collapsed-header {
      display: none;
    }
  }

  .el-menu--vertical:not(.el-menu--collapse):not(.el-menu--popup-container)
    .el-menu-item {
    @apply px-2.5;
  }

  .el-menu--vertical.el-menu--collapse {
    .menu-expanded-header {
      display: none;
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
