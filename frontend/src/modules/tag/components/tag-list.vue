<template>
  <div
    @mouseenter="showEdit = true"
    @mouseleave="showEdit = true"
  >
    <div class="inline-flex items-center flex-wrap w-full justify-between gap-x-2 gap-y-2.5">
      <span
        v-for="tag in computedTags"
        :key="tag.id"
        class="tag text-xs"
        :class="tagClasses"
      >
        {{ getTagName(tag) }}
      </span>
      <el-button
        v-if="editable && showEdit"
        class="text-gray-400 btn btn-link text-2xs bg-transparent hover:bg-transparent focus:bg-transparent"
        :class="member.tags.length > 0 ? 'ml-2' : ''"
        @click.prevent.stop="$emit('edit')"
      >
        <lf-icon name="pen" :size="14" class="!mr-1" />
        <span>{{ member.tags.length ? 'Edit' : 'Add' }} tags</span>
      </el-button>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import LfIcon from '@/ui-kit/icon/Icon.vue';

export default {
  name: 'AppTags',
  components: { LfIcon },
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
  setup() {
    const authStore = useAuthStore();
    const { user, tenant } = storeToRefs(authStore);
    return { user, tenant };
  },
  data() {
    return {
      model: null,
      loading: false,
      showEdit: true,
    };
  },
  computed: {
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
