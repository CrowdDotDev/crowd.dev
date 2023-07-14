<template>
  <app-dialog
    v-if="computedVisible"
    v-model="computedVisible"
    title="Edit tags"
    :pre-title="modelValue?.displayName ?? ''"
  >
    <template #content>
      <div class="px-6 pb-6">
        <form v-if="modelValue" class="tags-form">
          <app-tag-autocomplete-input
            v-model="form"
            :fetch-fn="fields.tags.fetchFn"
            :mapper-fn="fields.tags.mapperFn"
            :create-if-not-found="true"
            placeholder="Type to search/create tags"
          />
        </form>
      </div>

      <div
        class="bg-gray-50 rounded-b-md flex items-center justify-end py-4 px-6"
      >
        <el-button
          class="btn btn--secondary btn--md mr-3"
          @click="computedVisible = false"
        >
          Cancel
        </el-button>
        <el-button
          class="btn btn--primary btn--md"
          @click="handleSubmit"
        >
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
import { mapActions } from 'vuex';

const { fields } = MemberModel;

export default {
  name: 'AppTagPopover',
  components: { AppTagAutocompleteInput, AppDialog },

  props: {
    modelValue: {
      type: Object,
      default: () => null,
    },
  },
  emits: ['reload', 'update:modelValue'],

  data() {
    return {
      changed: false,
      loading: false,
      form: [],
    };
  },

  computed: {
    fields() {
      return fields;
    },
    computedVisible: {
      get() {
        return this.modelValue !== null;
      },
      set() {
        this.$emit('update:modelValue', null);
      },
    },
  },

  watch: {
    modelValue: {
      immediate: true,
      handler(member) {
        if (member) {
          this.form = member.tags;
        }
      },
    },
  },

  methods: {
    ...mapActions({
      doUpdate: 'member/doUpdate',
    }),
    async handleSubmit() {
      this.loading = true;
      await this.doUpdate({
        id: this.modelValue.id,
        values: {
          tags: this.form.map((tag) => tag.id),
        },
      });
      this.loading = false;
      this.computedVisible = false;
      this.$emit('reload');
    },
  },
};
</script>
