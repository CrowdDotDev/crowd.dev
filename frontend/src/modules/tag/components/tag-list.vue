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
        @click.prevent.stop="editing = true"
      >
        Edit tags
      </el-button>
    </div>
    <app-tag-popover
      v-model="model[fields.tags.name]"
      :visible="editing"
      :loading="loading"
      :pretitle="member.displayName"
      @cancel="editing = false"
      @submit="doSubmit"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { FormSchema } from '@/shared/form/form-schema';
import { MemberModel } from '@/modules/member/member-model';
import { MemberPermissions } from '@/modules/member/member-permissions';
import AppTagPopover from '@/modules/tag/components/tag-popover.vue';

const { fields } = MemberModel;
const formSchema = new FormSchema([
  fields.username,
  fields.info,
  fields.tags,
  fields.emails,
]);

export default {
  name: 'AppTags',
  components: { AppTagPopover },
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
  emits: ['tags-updated'],
  data() {
    return {
      rules: formSchema.rules(),
      model: null,
      editing: false,
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
  watch: {
    member: {
      handler(newValue) {
        this.model = formSchema.initialValues(
          newValue || {},
        );
      },
      deep: true,
    },
  },

  created() {
    this.model = formSchema.initialValues(this.member || {});
  },

  methods: {
    ...mapActions({
      doUpdate: 'member/doUpdate',
    }),
    async doSubmit() {
      this.loading = true;
      await this.doUpdate({
        id: this.member.id,
        values: formSchema.cast(this.model),
        segments: this.member.segmentIds,
      });
      this.loading = false;
      this.editing = false;
      this.$emit('tags-updated');
    },
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
