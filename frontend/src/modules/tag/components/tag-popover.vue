<template>
  <app-teleport to="#teleport-modal">
    <app-dialog
      v-model="computedVisible"
      title="Edit tags"
      :pre-title="pretitle"
    >
      <template #content>
        <div class="px-6 pb-6">
          <form v-if="visible" class="tags-form">
            <app-tag-autocomplete-input
              v-model="model"
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
            class="btn btn--bordered btn--md mr-3"
            @click="handleCancel"
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
  </app-teleport>
</template>

<script>
import { MemberModel } from '@/modules/member/member-model';

const { fields } = MemberModel;

export default {
  name: 'AppTagPopover',

  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: Array,
      default: () => [],
    },
    pretitle: {
      type: String,
      default: null,
    },
  },
  emits: ['submit', 'cancel', 'update:modelValue'],

  data() {
    return {
      changed: false,
    };
  },

  computed: {
    fields() {
      return fields;
    },
    model: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.changed = true;
        this.$emit('update:modelValue', value);
      },
    },
    computedVisible: {
      get() {
        return this.visible;
      },
      set() {
        this.handleCancel();
      },
    },
  },

  methods: {
    handleCancel() {
      this.$emit('cancel');
    },
    handleSubmit() {
      this.$emit('submit');
    },
  },
};
</script>
