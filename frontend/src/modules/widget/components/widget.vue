<template>
  <div class="widget panel">
    <div
      class="app-page-spinner"
      v-show="loading"
      v-loading="loading"
    ></div>
    <div
      class="flex items-center leading-normal justify-between"
      v-if="!number"
    >
      <div>
        <div class="font-semibold text-base">
          {{
            config.title || label(config.type) || 'Widget'
          }}
        </div>
        <div
          style="color: #666"
          v-if="config.subtitle"
          class="text-sm"
        >
          {{ config.subtitle }}
        </div>
      </div>
      <router-link
        :to="config.link"
        v-if="config.link"
        class="text-sm flex items-center ml-2"
      >
        <span class="block">{{ config.linkLabel }}</span>
        <i class="ri-arrow-right-line ml-1"></i>
      </router-link>
    </div>
    <div class="pt-4">
      <slot></slot>
    </div>
    <el-dropdown
      trigger="click"
      @command="handleCommand"
      v-if="config.settings"
    >
      <span class="el-dropdown-link">
        <i class="ri-xl ri-more-line"></i>
      </span>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item
          icon="ri-lg ri-settings-2-line"
          command="open-settings-modal"
          v-if="!editable"
          >Settings</el-dropdown-item
        >
        <el-dropdown-item
          icon="ri-lg ri-file-copy-line"
          command="trigger-duplicate-widget"
          v-if="editable"
          >Duplicate Widget</el-dropdown-item
        >
        <el-dropdown-item
          icon="ri-lg ri-pencil-line"
          command="trigger-edit-widget"
          v-if="editable"
          >Edit Widget</el-dropdown-item
        >
        <el-dropdown-item
          icon="ri-lg ri-delete-bin-line"
          command="trigger-delete-widget"
          v-if="editable"
          >Delete Widget</el-dropdown-item
        >
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
import { i18n } from '@/i18n'
import { mapGetters } from 'vuex'

export default {
  name: 'Widget',
  props: {
    config: {
      type: Object,
      default: () => {
        return {
          title: 'Label',
          name: 'name',
          type: 'bar',
          loading: false
        }
      }
    },
    number: {
      type: Boolean,
      default: false
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters({
      widgetFind: 'widget/find'
    }),
    widget() {
      return this.config.id
        ? this.widgetFind(this.config.id)
        : this.config
    },
    loading() {
      return this.widget.loading || this.config.loading
    }
  },
  methods: {
    label(widgetType) {
      return i18n(widgetType)
    },
    handleCommand(command) {
      this.$emit(command)
    }
  }
}
</script>

<style lang="scss">
.widget {
  @apply relative p-4 mt-0 mb-4;

  .el-dropdown {
    @apply absolute right-0 top-0 mt-4 mr-4;
    .el-dropdown-link.el-dropdown-selfdefine {
      @apply flex;
    }
  }

  .app-page-spinner {
    @apply bg-white absolute z-10 inset-0 m-0 min-h-16;
  }
}
</style>
