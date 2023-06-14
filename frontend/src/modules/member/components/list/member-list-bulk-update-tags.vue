<template>
  <div class="relative inline-flex">
    <app-tag-popover
      v-model="bulkEditTagsModel"
      pretitle="Multiple contributors"
      :visible="bulkEditTags"
      :loading="loading"
      @cancel="cancelBulkUpdateTags"
      @submit="doBulkUpdateTagsWithConfirm"
    />
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { mapActions as mapActionsPinia } from 'pinia';
import { FormSchema } from '@/shared/form/form-schema';
import AppTagPopover from '@/modules/tag/components/tag-popover.vue';
import { MemberService } from '@/modules/member/member-service';
import { useMemberStore } from '@/modules/member/store/pinia';
import { MemberModel } from '../../member-model';

const { fields } = MemberModel;
const formSchema = new FormSchema([fields.tags]);

export default {
  name: 'AppMemberListBulkUpdateTags',

  components: {
    AppTagPopover,
  },

  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    selectedRows: {
      type: Array,
      default: () => [],
    },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      bulkEditTags: false,
      bulkEditTagsModel: [],
      bulkEditTagsInCommon: [],
    };
  },

  watch: {
    modelValue: {
      async handler(newValue) {
        if (newValue) {
          await this.prepareBulkUpdateTags();
        }
      },
    },
  },

  methods: {
    ...mapActions({
      doBulkUpdateMembersTags:
        'member/doBulkUpdateMembersTags',
    }),
    ...mapActionsPinia(useMemberStore, ['fetchMembers']),

    async doBulkUpdateTagsWithConfirm() {
      try {
        this.$emit('update:modelValue', false);
        this.bulkEditTags = false;

        const segments = [];

        const payload = [...this.selectedRows].reduce((acc, item) => {
          const memberToUpdate = { ...item };
          segments.concat(item.segmentIds);
          const tagsToKeep = item.tags.filter(
            (tag) => this.bulkEditTagsInCommon.filter((t) => t.id === tag.id).length === 0
              && this.bulkEditTagsModel.filter((t) => t.id === tag.id).length === 0,
          );

          memberToUpdate.tags = [...tagsToKeep, ...this.bulkEditTagsModel];
          acc.push(
            formSchema.cast({
              id: memberToUpdate.id,
              tags: memberToUpdate.tags,
            }),
          );
          return acc;
        }, []);
        await MemberService.updateBulk(payload, segments);
        await this.fetchMembers({
          reload: true,
        });
      } catch (error) {
        // no
      }
      return null;
    },

    prepareBulkUpdateTags() {
      this.bulkEditTagsModel = this.selectedRows.reduce(
        (acc, item, index) => {
          let { tags } = formSchema.initialValues({
            tags: item.tags,
          });
          if (index > 0) {
            tags = tags.filter(
              (tag) => acc.filter((t) => t.id === tag.id).length
                > 0,
            );
          }
          return tags;
        },
        [],
      );
      this.bulkEditTagsInCommon = [
        ...this.bulkEditTagsModel,
      ];
      this.bulkEditTags = true;
    },

    cancelBulkUpdateTags() {
      this.bulkEditTagsModel = [];
      this.bulkEditTagsInCommon = [];
      this.$emit('update:modelValue', false);
      this.bulkEditTags = false;
    },
  },
};
</script>
