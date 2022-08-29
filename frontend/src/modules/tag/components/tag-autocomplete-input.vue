<template>
  <div style="display: flex">
    <app-autocomplete-many-input
      v-if="multiple"
      v-model="model"
      :fetch-fn="fetchFn"
      :create-fn="createTag"
      :placeholder="placeholder"
      :create-if-not-found="canCreate"
    ></app-autocomplete-many-input>
    <app-autocomplete-one-input
      v-else
      v-model="model"
      :fetch-fn="fetchFn"
      :create-fn="createTag"
      :placeholder="placeholder"
      :create-if-not-found="canCreate"
    ></app-autocomplete-one-input>
  </div>
</template>

<script>
import { TagPermissions } from '@/modules/tag/tag-permissions'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'AppTagAutocompleteInput',
  props: {
    value: {
      type: Array,
      default: () => []
    },
    fetchFn: {
      type: Function,
      default: () => {}
    },
    mapperFn: {
      type: Function,
      default: () => {}
    },
    createIfNotFound: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: null
    },
    multiple: {
      type: Boolean,
      default: true
    }
  },
  emits: { input: null },

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant'
    }),

    model: {
      get: function () {
        return this.value
      },

      set: function (value) {
        this.$emit('input', value)
      }
    },

    canCreate() {
      return (
        new TagPermissions(
          this.currentTenant,
          this.currentUser
        ).create && this.createIfNotFound
      )
    }
  },

  methods: {
    ...mapActions({
      doCreateTag: 'tag/form/doAutocompleteCreate'
    }),

    async createTag(value) {
      const newTag = await this.doCreateTag({
        name: value
      })

      return {
        id: newTag.id,
        label: newTag.name
      }
    }
  }
}
</script>

<style>
.el-form-item .el-form-item {
  margin-bottom: 22px;
}
</style>
