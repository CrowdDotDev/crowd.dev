<template>
  <el-dropdown
    v-if="!isReadOnly"
    ref="dropdown"
    trigger="click"
    placement="bottom-end"
  >
    <slot name="trigger">
      <button
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
        type="button"
        @click.prevent.stop
      >
        <i class="text-xl ri-more-fill" />
      </button>
    </slot>

    <template #dropdown>
      <app-member-dropdown-content
        :member="member"
        :hide-edit="hideEdit"
        :hide-merge="hideMerge"
        @find-github="emit('findGithub')"
        @close-dropdown="onDropdownClose"
        @merge="emit('merge')"
      />
    </template>
  </el-dropdown>
</template>

<script setup>
import { MemberPermissions } from '@/modules/member/member-permissions';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { computed, ref } from 'vue';
import AppMemberDropdownContent from './member-dropdown-content.vue';

const emit = defineEmits(['merge', 'closeDropdown', 'findGithub']);
defineProps({
  member: {
    type: Object,
    default: () => {},
  },
  hideEdit: {
    type: Boolean,
    default: false,
  },
  hideMerge: {
    type: Boolean,
    default: false,
  },
});

const { currentTenant, currentUser } = mapGetters('auth');

const dropdown = ref();

const isReadOnly = computed(() => (
  new MemberPermissions(
    currentTenant.value,
    currentUser.value,
  ).edit === false
));

const onDropdownClose = () => {
  dropdown.value?.handleClose();
  emit('closeDropdown');
};
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
