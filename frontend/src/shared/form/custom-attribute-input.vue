<template>
  <div class="app-custom-attribute-input">
    <div
      v-for="(attribute, index) in attributes"
      :key="index"
      class="flex -mx-2"
    >
      <el-form-item class="flex flex-grow mx-2">
        <el-input
          v-model="attribute.name"
          placeholder="Name"
        >
        </el-input>
      </el-form-item>
      <el-form-item class="flex flex-grow mx-2">
        <el-input
          v-model="attribute.value"
          placeholder="Value"
        >
        </el-input>
      </el-form-item>
      <el-tooltip content="Click to delete" placement="top">
        <button
          class="text-black p-0 border-none bg-transparent flex items-center justify-center w-8 h-10"
          type="button"
          @click="deleteAttribute(index)"
        >
          <i class="ri-delete-bin-line ri-lg"></i>
        </button>
      </el-tooltip>
    </div>
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
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'

export default {
  name: 'AppCustomAttributeInput',
  props: {
    value: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['update:modelValue'],
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
          'update:modelValue',
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
        await ConfirmDialog({
          title: i18n('common.confirm'),
          message: i18n('common.areYouSure'),
          confirmButtonText: i18n('common.yes'),
          cancelButtonText: i18n('common.no')
        })

        this.attributes.splice(index, 1)
      } catch (error) {
        // no
      }
    }
  }
}
</script>
