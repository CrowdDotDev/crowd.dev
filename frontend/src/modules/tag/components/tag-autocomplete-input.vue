<template>
  <div class="app-tags-input" style="display: flex">
    <app-autocomplete-many-input
      v-model="model"
      :fetch-fn="fetchFn"
      :create-fn="createTag"
      :mapper-fn="mapperFn"
      :placeholder="placeholder"
      :create-if-not-found="hasPermission(LfPermission.tagCreate) && createIfNotFound"
    />
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

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
  },
  emits: ['update:modelValue'],
  setup() {
    const authStore = useAuthStore();
    const { user } = storeToRefs(authStore);

    const { hasPermission } = usePermissions();
    return { user, hasPermission };
  },
  computed: {
    LfPermission() {
      return LfPermission;
    },
    model: {
      get() {
        return this.modelValue;
      },

      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
  },

  methods: {
    ...mapActions({
      doCreateTag: 'tag/form/doAutocompleteCreate',
    }),

    async createTag(value) {
      const newTag = await this.doCreateTag({
        name: value,
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
