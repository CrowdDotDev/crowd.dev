<template>
  <div style="display: flex">
    <app-autocomplete-many-input
      :fetchFn="fetchFn"
      :createFn="createTag"
      v-model="model"
      :placeholder="placeholder"
      :createIfNotFound="canCreate"
      v-if="multiple"
    ></app-autocomplete-many-input>
    <app-autocomplete-one-input
      :fetchFn="fetchFn"
      :createFn="createTag"
      v-model="model"
      :placeholder="placeholder"
      :createIfNotFound="canCreate"
      v-else
    ></app-autocomplete-one-input>
  </div>
</template>

<script>
import { TagPermissions } from '@/modules/tag/tag-permissions'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'app-tag-autocomplete-input',
  props: {
    value: {},
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
      type: String
    },
    multiple: {
      type: Boolean,
      default: true
    }
  },

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
