<template>
  <div class="app-member-platform-input">
    <div
      v-if="platforms.length > 0"
      class="flex flex-1 mb-1 -mx-2"
    >
      <div
        class="mx-2 flex flex-1 text-xs text-gray-600 uppercase"
      >
        Platform
      </div>
      <div
        class="mx-2 flex flex-1 text-xs text-gray-600 uppercase"
      >
        Username
      </div>
      <div
        class="mx-2 flex flex-1 text-xs text-gray-600 uppercase"
      >
        Profile URL
      </div>
      <div v-if="platforms.length > 1" class="w-8"></div>
    </div>
    <div
      v-for="(platform, index) in platforms"
      :key="index"
      class="flex -mx-2"
    >
      <el-form-item class="flex flex-grow mx-2">
        <app-platform-autocomplete-input
          v-model="platform.name"
          placeholder="Github"
          class="flex flex-1"
        />
      </el-form-item>
      <el-form-item class="flex flex-grow mx-2">
        <el-input
          v-model="platform.username"
          placeholder="johndoe"
        />
      </el-form-item>
      <el-form-item class="flex flex-grow mx-2">
        <el-input
          v-model="platform.url"
          placeholder="https://github.com/johndoe"
        />
      </el-form-item>
      <el-tooltip content="Click to delete" placement="top">
        <button
          v-if="platforms.length > 1"
          class="text-black p-0 border-none bg-transparent flex items-center justify-center w-8 h-10"
          type="button"
          @click="deletePlatform(index)"
        >
          <i class="ri-delete-bin-line ri-lg"></i>
        </button>
      </el-tooltip>
    </div>
    <button
      class="btn btn--link"
      type="button"
      @click="addPlatform"
    >
      <i class="ri-add-line mr-1"></i> Add platform
    </button>
  </div>
</template>

<script>
import { i18n } from '@/i18n'
import AppPlatformAutocompleteInput from '@/shared/form/platform-autocomplete-input'

export default {
  name: 'AppMemberPlatformInput',
  components: {
    AppPlatformAutocompleteInput
  },
  props: {
    value: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      platforms: [].concat(this.value)
    }
  },
  watch: {
    platforms: {
      handler(newValue) {
        return this.$emit(
          'update:modelValue',
          newValue.reduce((acc, item) => {
            if (
              item.name &&
              item.name !== '' &&
              item.url &&
              item.url !== ''
            ) {
              acc.push(item)
            }
            return acc
          }, [])
        )
      },
      deep: true
    }
  },
  methods: {
    addPlatform() {
      this.platforms.push({
        name: null,
        username: null,
        url: null
      })
    },
    async deletePlatform(index) {
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

        this.platforms.splice(index, 1)
      } catch (error) {
        // no
      }
    }
  }
}
</script>
