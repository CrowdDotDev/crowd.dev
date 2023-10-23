<template>
  <div>
    <el-dropdown
      v-if="!isReadOnly"
      trigger="click"
      placement="bottom-end"
    >
      <button
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
        type="button"
        @click.prevent.stop
      >
        <i class="text-xl ri-more-fill" />
      </button>
      <template #dropdown>
        <app-member-dropdown-content
          :member="member"
          @merge="emit('merge')"
          @close-dropdown="emit('closeDropdown')"
        />
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { MemberPermissions } from '@/modules/member/member-permissions';
import AppMemberDropdownContent from './member-dropdown-content.vue';

const emit = defineEmits(['merge', 'closeDropdown']);
defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const { currentTenant, currentUser } = mapGetters('auth');

const isReadOnly = computed(() => (
  new MemberPermissions(
    currentTenant.value,
    currentUser.value,
  ).edit === false
));
</script>

<style lang="scss">
.el-dropdown__popper .el-dropdown__list {
  @apply p-2;
}

// Override divider margin
.el-divider--horizontal {
  @apply my-2;
}
</style>
