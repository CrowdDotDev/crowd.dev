<template>
  <app-dialog v-if="computedVisible" v-model="computedVisible" title="Edit tags">
    <template #content>
      <div class="px-6 pb-6">
        <form v-if="modelValue" class="tags-form">
          <app-tag-autocomplete-input v-model="bulkEditTagsModel" :fetch-fn="fields.tags.fetchFn"
            :mapper-fn="fields.tags.mapperFn" :create-if-not-found="true" placeholder="Type to search/create tags" />
        </form>
      </div>

      <div class="bg-gray-50 rounded-b-md flex items-center justify-end py-4 px-6">
        <el-button class="btn btn--bordered btn--md mr-3" @click="handleCancel">
          Cancel
        </el-button>
        <el-button class="btn btn--primary btn--md" @click="handleSubmit">
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
  },
  emits: ['reload', 'update:modelValue'],

  data() {
    return {
      loading: false,
      bulkEditTagsModel: [],
      bulkEditTagsInCommon: [],
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

    prepareBulkUpdateTags() {
      this.bulkEditTagsModel = selectedMembers.value.reduce(
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
    },

    async handleSubmit() {
      this.loading = true;

      await this.doBulkUpdateMembersTags({
        members: [...selectedMembers.value],
        tagsInCommon: this.bulkEditTagsInCommon,
        tagsToSave: this.bulkEditTagsModel,
      });

      this.loading = false;
      this.computedVisible = false;
      this.$emit('reload', true);
      return null;
    },

    handleCancel() {
      this.bulkEditTagsModel = [];
      this.bulkEditTagsInCommon = [];
      this.computedVisible = false;
    }
  },
};
</script>
