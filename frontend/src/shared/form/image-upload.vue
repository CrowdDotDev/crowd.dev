<template>
  <div>
    <el-upload
      ref="files"
      :accept="accept"
      :class="{
        'image-upload-hide-upload': isFull || loading
      }"
      :file-list="fileList"
      :http-request="uploadFromRequest"
      :on-error="onError"
      :on-preview="handlePictureCardPreview"
      :on-remove="onRemove"
      :on-success="onSuccess"
      action
      list-type="picture-card"
    >
      <i class="el-icon-plus"></i>
    </el-upload>

    <el-dialog v-model="dialogVisible">
      <img :src="dialogImageUrl" alt width="100%" />
    </el-dialog>
  </div>
</template>

<script>
import { FileUploader } from '@/shared/file-upload/file-uploader'
import Errors from '@/shared/error/errors'

export default {
  name: 'AppImageUpload',
  props: {
    storage: {
      type: String,
      default: null
    },
    value: {
      type: Array,
      default: () => []
    },
    max: {
      type: Number,
      default: null
    }
  },
  emits: ['update:modelValue'],

  data() {
    return {
      dialogImageUrl: '',
      dialogVisible: false,
      loading: false
    }
  },

  computed: {
    isFull() {
      const hasInputReference = Boolean(this.$refs.files)

      return (
        (this.max &&
          hasInputReference &&
          this.$refs.files.uploadFiles.length >=
            this.max) ||
        (!hasInputReference &&
          (this.value || []).length >= this.max)
      )
    },

    accept() {
      return 'image/*'
    },

    fileList() {
      return (this.value || []).map((item) => ({
        ...item,
        url: item.downloadUrl
      }))
    }
  },

  methods: {
    async uploadFromRequest(request) {
      this.loading = true
      return FileUploader.uploadFromRequest(request, {
        storage: this.storage,
        image: true
      })
    },

    onSuccess(file) {
      if (!file) {
        return
      }

      this.$emit('update:modelValue', [
        ...(this.value || []),
        file
      ])
      this.loading = false
    },

    onError(error) {
      Errors.showMessage(error)
      this.loading = false
    },

    onRemove(file) {
      if (!file) {
        return
      }

      const id = file.response ? file.response.id : file.id

      this.$emit(
        'update:modelValue',
        (this.value || []).filter((item) => item.id !== id)
      )
    },

    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url
      this.dialogVisible = true
    }
  }
}
</script>

<style>
.image-upload-hide-upload .el-upload--picture-card {
  display: none !important;
}
</style>
