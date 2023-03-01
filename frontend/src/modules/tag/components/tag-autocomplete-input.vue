<template>
  <div class="app-tags-input" style="display: flex">
    <app-autocomplete-many-input
      v-model="model"
      :fetch-fn="fetchFn"
      :create-fn="createTag"
      :mapper-fn="mapperFn"
      :placeholder="placeholder"
      :create-if-not-found="canCreate"
    ></app-autocomplete-many-input>
  </div>
</template>

<script>
import { TagPermissions } from '@/modules/tag/tag-permissions'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'AppTagAutocompleteInput',
  props: {
    modelValue: {
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
    }
  },
  emits: ['update:modelValue'],

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant'
    }),

    model: {
      get: function () {
        return this.modelValue
      },

      set: function (value) {
        this.$emit('update:modelValue', value)
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
