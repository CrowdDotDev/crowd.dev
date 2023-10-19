<template>
  <div class="widget">
    <div
      v-if="!number"
      class="flex items-center leading-normal justify-between"
    >
      <div>
        <div class="font-semibold text-sm">
          {{
            config.title || label(config.type) || 'Widget'
          }}
        </div>
        <div
          v-if="config.subtitle"
          style="color: #666"
          class="text-2xs"
        >
          {{ config.subtitle }}
        </div>
      </div>
      <router-link
        v-if="config.link"
        :to="config.link"
        class="text-sm flex items-center ml-2"
      >
        <span class="block">{{ config.linkLabel }}</span>
        <i class="ri-arrow-right-line ml-1" />
      </router-link>
    </div>
    <div class="pt-4">
      <div
        v-if="loading"
        v-loading="loading"
        class="app-page-spinner !relative top-2"
      />
      <slot v-else-if="show" />
    </div>
    <el-dropdown
      v-if="config.settings"
      trigger="click"
      @command="handleCommand"
    >
      <span class="el-dropdown-link">
        <i class="ri-xl ri-more-line" />
      </span>
      <template #dropdown>
        <el-dropdown-item
          v-if="!editable"
          command="open-settings-modal"
        >
          <i
            class="ri-lg ri-settings-2-line mr-1"
          />Settings
        </el-dropdown-item>
        <el-dropdown-item
          v-if="editable"
          command="trigger-duplicate-widget"
        >
          <i
            class="ri-lg ri-file-copy-line mr-1"
          />Duplicate widget
        </el-dropdown-item>
        <el-dropdown-item
          v-if="editable"
          command="trigger-edit-widget"
        >
          <i class="ri-lg ri-pencil-line mr-1" />Edit
          widget
        </el-dropdown-item>
        <el-divider class="border-gray-200 my-2" />
        <el-dropdown-item
          v-if="editable"
          command="trigger-delete-widget"
        >
          <i
            class="ri-lg ri-delete-bin-line mr-1 text-red-500"
          /><span class="text-red-500">Delete widget</span>
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { i18n } from '@/i18n';

export default {
  name: 'AppWidget',
  props: {
    show: {
      type: Boolean,
      default: true,
    },
    config: {
      type: Object,
      default: () => ({
        title: 'Label',
        name: 'name',
        type: 'bar',
        loading: false,
      }),
    },
    number: {
      type: Boolean,
      default: false,
    },
    editable: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapGetters({
      widgetFind: 'widget/find',
    }),
    widget() {
      return this.config.id
        ? this.widgetFind(this.config.id)
        : this.config;
    },
    loading() {
      return this.widget.loading || this.config.loading;
    },
  },
  methods: {
    label(widgetType) {
      return i18n(widgetType);
    },
    handleCommand(command) {
      this.$emit(command);
    },
  },
};
</script>

<style lang="scss">
.widget {
  @apply relative mt-0;

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
