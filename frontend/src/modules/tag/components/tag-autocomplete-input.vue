<template>
  <div class="app-tags-input" style="display: flex">
    <app-autocomplete-many-input
      v-model="model"
      :fetch-fn="fetchFn"
      :create-fn="createTag"
      :mapper-fn="mapperFn"
      :placeholder="placeholder"
      :create-if-not-found="canCreate"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { TagPermissions } from '@/modules/tag/tag-permissions';

export default {
  name: 'AppTagAutocompleteInput',
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    fetchFn: {
      type: Function,
      default: () => {},
    },
    mapperFn: {
      type: Function,
      default: () => {},
    },
    createIfNotFound: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: null,
    },
    segments: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue'],

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
    }),

    model: {
      get() {
        return this.modelValue;
      },

      set(value) {
        this.$emit('update:modelValue', value);
      },
    },

    canCreate() {
      return (
        new TagPermissions(
          this.currentTenant,
          this.currentUser,
        ).create && this.createIfNotFound
      );
    },
  },

  methods: {
    ...mapActions({
      doCreateTag: 'tag/form/doAutocompleteCreate',
    }),

    async createTag(value) {
      const newTag = await this.doCreateTag({
        name: value,
        segments: this.segments,
      });

      return {
        id: newTag.id,
        label: newTag.name,
      };
    },
  },
};
</script>

<style>
.el-form-item .el-form-item {
  margin-bottom: 22px;
}
</style>
