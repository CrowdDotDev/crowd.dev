<template>
  <app-dialog v-if="computedVisible" v-model="computedVisible" title="Edit tags"  :pre-title="member?.displayName ?? ''">
    <template #content>
      <div class="px-6 pb-6">
        <form v-if="modelValue" class="tags-form">
          <app-tag-autocomplete-input v-model="editTagsModel" :fetch-fn="fields.tags.fetchFn"
            :mapper-fn="fields.tags.mapperFn" :create-if-not-found="true" placeholder="Type to search/create tags" />
        </form>
      </div>

      <div class="bg-gray-50 rounded-b-md flex items-center justify-end py-4 px-6">
        <el-button class="btn btn--bordered btn--md mr-3" @click="handleCancel">
          Cancel
        </el-button>
        <el-button class="btn btn--primary btn--md" @click="handleSubmit" :disabled="!hasSelectedRole">
          Submit
        </el-button>
      </div>
    </template>
  </app-dialog>
</template>

<script>
import { MemberModel } from '@/modules/member/member-model';
import AppDialog from '@/shared/dialog/dialog.vue';
import AppTagAutocompleteInput from '@/modules/tag/components/tag-autocomplete-input.vue';
import { FormSchema } from '@/shared/form/form-schema';
import { mapActions } from 'vuex';
import { storeToRefs } from 'pinia';
import { useMemberStore } from '@/modules/member/store/pinia';

const memberStore = useMemberStore();
const { selectedMembers } = storeToRefs(memberStore);

const { fields } = MemberModel;
const formSchema = new FormSchema([fields.tags]);


export default {
  name: 'AppTagPopover',
  components: { AppTagAutocompleteInput, AppDialog },

  props: {
    modelValue: {
      type: Boolean,
      default: () => false,
    },
    member: {
      type: Object,
      default: () => null,
    },
  },
  emits: ['reload', 'update:modelValue'],

  data() {
    return {
      loading: false,
      editTagsModel: [],
      editTagsInCommon: [],
    };
  },

  computed: {
    fields() {
      return fields;
    },
    computedVisible: {
      get() {
        return this.modelValue;
      },
      set() {
        this.$emit('update:modelValue', false);
      },
    },
    membersToUpdate() {
      return this.member ? [this.member]: selectedMembers.value;
    },
    hasSelectedRole() {
      return this.editTagsModel.length > 0;
    },
  },

  watch: {
    modelValue: {
      async handler(newValue) {
        if (newValue) {
          await this.prepareUpdateTags();
        }
      },
    },
  },

  methods: {
    ...mapActions({
      doBulkUpdateMembersTags:
        'member/doBulkUpdateMembersTags',
    }),

    prepareUpdateTags() {
      this.editTagsModel = this.membersToUpdate.reduce(
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
      this.editTagsInCommon = [
        ...this.editTagsModel,
      ];
    },

    async handleSubmit() {
      this.loading = true;

      await this.doBulkUpdateMembersTags({
        members: [...this.membersToUpdate],
        tagsInCommon: this.editTagsInCommon,
        tagsToSave: this.editTagsModel,
      });

      this.loading = false;
      this.computedVisible = false;
      this.$emit('reload', true);
      return null;
    },

    handleCancel() {
      this.editTagsModel = [];
      this.editTagsInCommon = [];
      this.computedVisible = false;
    }
  },
};
</script>