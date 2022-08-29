<template>
  <div class="app-community-member-platform-input">
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
    <el-form-item
      v-for="(platform, index) in platforms"
      :key="index"
    >
      <app-platform-autocomplete-input
        v-model="platform.name"
        placeholder="Github"
        class="block mx-2 flex flex-1"
      />
      <el-input
        v-model="platform.username"
        placeholder="johndoe"
        class="block mx-2 flex flex-1"
      />
      <el-input
        v-model="platform.url"
        placeholder="https://github.com/johndoe"
        class="block mx-2 flex flex-1"
      />
      <el-tooltip content="Click to delete" placement="top">
        <button
          v-if="platforms.length > 1"
          class="text-black p-0 border-none bg-transparent flex items-center justify-center w-8"
          type="button"
          @click="deletePlatform(index)"
        >
          <i class="ri-delete-bin-line ri-lg"></i>
        </button>
      </el-tooltip>
    </el-form-item>
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
  name: 'AppCommunityMemberPlatformInput',
  components: {
    AppPlatformAutocompleteInput
  },
  props: {
    value: {
      type: Array,
      default: () => []
    }
  },
  emits: ['input'],
  data() {
    return {
      platforms: [].concat(this.value)
    }
  },
  watch: {
    platforms: {
      handler(newValue) {
        return this.$emit(
          'input',
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

<style lang="scss">
.app-community-member-platform-input {
  .el-form-item {
    &.el-form-item {
      @apply mb-2;
    }
    &__content {
      @apply flex flex-1 items-center -mx-2;
      & > .el-input,
      & > .block > .el-select {
        @apply w-auto;
      }
    }
  }
}
</style>
