<template>
  <aside
    class="l-menu"
    :class="isCollapsed ? 'w-16 min-w-16' : 'w-65 min-w-65'"
  >
    <lf-menu-link
      title="All project groups"
      icon="folders-line"
      :is-collapsed="isCollapsed"
      :to="{ path: '/project-groups' }"
    />
    <div class="px-3 py-4">
      <app-lf-menu-project-group-selection
        v-if="!isCollapsed"
      />
      <el-divider v-else class="!mt-1 !mb-0" />
    </div>
    <lf-menu-link
      title="Overview"
      icon="home-5-line"
      :is-collapsed="isCollapsed"
      :to="{ path: '/', query: { projectGroup: selectedProjectGroup?.id } }"
      :disabled="!selectedProjectGroup"
    />
    <lf-menu-link
      title="People"
      icon="group-2-line"
      :is-collapsed="isCollapsed"
      :to="{ path: '/people', query: { projectGroup: selectedProjectGroup?.id } }"
      :disabled="!selectedProjectGroup"
      @click="onMembersClick"
    />
    <lf-menu-link
      title="Organizations"
      icon="community-line"
      :is-collapsed="isCollapsed"
      :to="{ path: '/organizations', query: { projectGroup: selectedProjectGroup?.id } }"
      :disabled="!selectedProjectGroup"
      @click="onOrganizationsClick"
    />
    <lf-menu-link
      title="Activities"
      icon="radar-line"
      :is-collapsed="isCollapsed"
      :to="{ path: '/activities', query: { projectGroup: selectedProjectGroup?.id } }"
      :disabled="!selectedProjectGroup"
    />
    <div class="flex-grow" />
    <div class="flex justify-end pb-8">
      <div
        class="bg-gray-500 w-6 h-8 rounded-l flex items-center justify-center cursor-pointer"
        @click="toggleMenu()"
      >
        <lf-icon
          :name="`arrow-${isCollapsed ? 'right' : 'left'}-double-fill`"
          :size="20"
          class="text-white"
        />
      </div>
    </div>
    <lf-menu-link
      v-if="hasPermission(LfPermission.eagleEyeRead)"
      title="Community Lens"
      icon="eye-2-line"
      :is-collapsed="isCollapsed"
      :to="{ path: '/community-lens' }"
    />
    <div class="px-3 py-4">
      <div class="border-b border-gray-200" />
    </div>
    <lf-menu-link
      v-if="hasPermission(LfPermission.projectGroupCreate) || hasPermission(LfPermission.projectGroupEdit)"
      title="Admin panel"
      icon="settings-3-line"
      :is-collapsed="isCollapsed"
      :to="{ path: '/admin' }"
    />
  </aside>
</template>

<script setup>
import { watch } from 'vue';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import AppLfMenuProjectGroupSelection from '@/modules/lf/layout/components/lf-menu-project-group-selection.vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { useStore } from 'vuex';
import { useActivityStore } from '@/modules/activity/store/pinia';
import { useMemberStore } from '@/modules/member/store/pinia';
import allMembers from '@/modules/member/config/saved-views/views/all-members';
import allOrganizations from '@/modules/organization/config/saved-views/views/all-organizations';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import LfMenuLink from '@/modules/layout/components/menu/menu-link.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

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

const onMembersClick = () => {
  membersFilters.value = allMembers.config;
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
    @apply bg-primary-25 flex flex-col relative;

    .el-menu {
      @apply bg-primary-25;
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
        @apply bg-primary-50 text-gray-900 font-medium;

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
