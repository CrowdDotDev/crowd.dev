<template>
  <div
    @mouseenter="showEdit = true"
    @mouseleave="showEdit = true"
  >
    <div class="inline-flex items-center flex-wrap w-full">
      <span
        v-for="tag in computedTags"
        :key="tag.id"
        class="tag mr-2 my-1 text-xs"
        :class="tagClasses"
      >{{ getTagName(tag) }}</span>
      <el-button
        v-if="editable && showEdit"
        class="text-gray-300 hover:text-gray-600 btn btn-link text-2xs"
        :class="member.tags.length > 0 ? 'ml-2' : ''"
        :disabled="isEditLockedForSampleData"
        @click.prevent.stop="$emit('edit')"
      >
        Edit tags
      </el-button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { MemberPermissions } from '@/modules/member/member-permissions';

export default {
  name: 'AppTags',
  props: {
    member: {
      type: Object,
      default: () => {},
    },
    tagClasses: {
      type: String,
      default: '',
    },
    editable: {
      type: Boolean,
      default: true,
    },
    long: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['tags-updated', 'edit'],
  data() {
    return {
      model: null,
      loading: false,
      showEdit: true,
    };
  },
  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser',
    }),
    computedTags() {
      const max = this.long ? 8 : 3;
      const tags = this.member.tags || [];
      return tags.length <= max || this.long
        ? tags
        : tags.slice(0, 3).concat({
          id: 'more',
          name: `+${tags.length - 3}`,
        });
    },
    fields() {
      return fields;
    },
    isEditLockedForSampleData() {
      return new MemberPermissions(
        this.currentTenant,
        this.currentUser,
      ).editLockedForSampleData;
    },
  },

  methods: {
    getTagName(tag) {
      if (!this.long) {
        return tag.name.length > 10
          ? `${tag.name.slice(0, 10)}...`
          : tag.name;
      }
      return tag.name;
    },
  },
};
</script>

<style lang="scss">
.tags-form {
  .el-select {
    @apply w-full;
  }
}
</style>
