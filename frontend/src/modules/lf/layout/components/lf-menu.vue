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
            @click="onContributorsClick"
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
            @click="onOrganizationsClick"
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

        <div class="grow" />

        <!-- Eagle eye -->
        <el-tooltip
          v-if="hasPermission(LfPermission.eagleEyeRead)"
          :disabled="!isCollapsed"
          :hide-after="50"
          effect="dark"
          placement="right"
          raw-content
          popper-class="custom-menu-tooltip"
          content="Community Lens"
        >
          <router-link
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
          v-if="hasPermission(LfPermission.projectGroupCreate) || hasPermission(LfPermission.projectGroupEdit)"
          class="border-gray-200 !mb-1"
        />

        <div class="mb-6">
          <el-tooltip
            v-if="hasPermission(LfPermission.projectGroupCreate) || hasPermission(LfPermission.projectGroupEdit)"
            :disabled="!isCollapsed"
            :hide-after="50"
            effect="dark"
            placement="right"
            raw-content
            popper-class="custom-menu-tooltip"
            content="Admin panel"
          >
            <router-link
              id="menu-admin-panel"
              :to="{ path: '/admin' }"
              class="el-menu-item"
              :class="classFor('/admin')"
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
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import AppLfMenuProjectGroupSelection from '@/modules/lf/layout/components/lf-menu-project-group-selection.vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { useStore } from 'vuex';
import { useActivityStore } from '@/modules/activity/store/pinia';
import { useMemberStore } from '@/modules/member/store/pinia';
import allContacts from '@/modules/member/config/saved-views/views/all-contacts';
import allOrganizations from '@/modules/organization/config/saved-views/views/all-organizations';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const store = useStore();

const { menuCollapsed: isCollapsed } = mapGetters('layout');

const { fetchActivityTypes } = useActivityTypeStore();
const { fetchActivityChannels } = useActivityStore();

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const memberStore = useMemberStore();
const { filters: membersFilters } = storeToRefs(memberStore);

const organizationStore = useOrganizationStore();
const { filters: organizationFilters } = storeToRefs(organizationStore);

const { hasPermission } = usePermissions();

const onContributorsClick = () => {
  membersFilters.value = allContacts.config;
};

const onOrganizationsClick = () => {
  organizationFilters.value = allOrganizations.config;
};

watch(
  selectedProjectGroup,
  (updatedProjectGroup) => {
    if (updatedProjectGroup) {
      fetchActivityTypes([selectedProjectGroup.value.id]);
      fetchActivityChannels([selectedProjectGroup.value.id]);
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
