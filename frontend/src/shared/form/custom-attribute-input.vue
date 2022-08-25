<template>
  <div class="app-custom-attribute-input">
    <el-form-item
      v-for="(attribute, index) in attributes"
      :key="index"
    >
      <el-input
        placeholder="Name"
        v-model="attribute.name"
        class="flex-grow block mx-2"
      >
      </el-input>
      <el-input
        placeholder="Value"
        v-model="attribute.value"
        class="flex-grow block mx-2"
      >
      </el-input>
      <el-tooltip content="Click to delete" placement="top">
        <button
          class="text-black p-0 border-none bg-transparent flex items-center justify-center w-8"
          type="button"
          @click="deleteAttribute(index)"
        >
          <i class="ri-delete-bin-line ri-lg"></i>
        </button>
      </el-tooltip>
    </el-form-item>
    <button
      class="btn btn--link"
      type="button"
      @click="addAttribute"
    >
      <i class="ri-add-line mr-1"></i> Add attribute
    </button>
  </div>
</template>

<script>
import { i18n } from '@/i18n'

export default {
  name: 'app-custom-attribute-input',
  props: {
    value: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      attributes: this.value
        ? Object.keys(this.value).map((key) => {
            return {
              name: key,
              value: this.value[key]
            }
          })
        : []
    }
  },
  watch: {
    attributes: {
      handler(newValue) {
        return this.$emit(
          'input',
          newValue.reduce((acc, item) => {
            if (
              item.name &&
              item.name !== '' &&
              item.value &&
              item.value !== ''
            ) {
              acc[item.name] = item.value
            }
            return acc
          }, {})
        )
      },
      deep: true
    }
  },
  methods: {
    addAttribute() {
      this.attributes.push({ name: null, value: null })
    },
    async deleteAttribute(index) {
      try {
        await this.$myConfirm(
          i18n('common.areYouSure'),
          i18n('common.confirm'),
          {
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no'),
            type: 'warning'
          }
        )

        this.attributes.splice(index, 1)
      } catch (error) {
        // no
      }
    }
  }
}
</script>

<style lang="scss">
.app-custom-attribute-input {
  .el-form-item {
    &.el-form-item {
      @apply mb-2;
    }
    &__content {
      @apply flex items-center -mx-2;
      & > .el-input {
        @apply w-auto;
      }
    }
  }
}
</style>
