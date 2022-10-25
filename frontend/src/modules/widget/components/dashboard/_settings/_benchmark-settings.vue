<template>
  <div class="benchmark-settings">
    <div
      v-if="!githubIntegration"
      class="bg-gray-100 border p-4 mb-8 rounded"
    >
      <div class="flex items-center mb-2 font-semibold">
        <i class="ri-information-line mr-2"></i>
        <span class="block"
          >GitHub Integration Required</span
        >
      </div>
      <div>
        In order to benchmark your repository with other
        repositories from GitHub, you need to set your
        GitHub's integration first.
        <br />
        <br />
        Click
        <router-link
          :to="{
            name: 'settings',
            query: { activeTab: 'integrations' }
          }"
          class="font-semibold"
          >here</router-link
        >
        to see our available integrations.
      </div>
    </div>
    <form v-else @submit="handleSubmit">
      <div class="flex justify-between items-center">
        <span class="text-sm"
          >1. Choose the time frame.</span
        >
        <el-select
          v-model="timeframe"
          placeholder="Select"
          value-key="value"
        >
          <el-option
            v-for="(item, index) in timeframeOptions"
            :key="index"
            :label="item.label"
            :value="item"
          >
          </el-option>
        </el-select>
      </div>
      <hr class="my-4" />
      <span class="text-sm"
        >2. Next, add/select the repositories you want to
        benchmark.</span
      >
      <div class="benchmark-settings-repositories">
        <div
          v-for="(repo, index) in repositories"
          :key="repo.id"
          class="benchmark-settings-repositories-item"
        >
          <div>
            <div
              v-if="repo.editing !== true"
              class="flex items-center"
            >
              <el-checkbox v-model="repo.active">{{
                repo.label
              }}</el-checkbox>
              <el-color-picker
                v-model="repo.color"
                class="absolute right-0 mr-12"
                size="mini"
              />
            </div>

            <div v-else class="flex items-center">
              <el-input
                v-model="repo.label"
                :placeholder="repo.value"
                class="mr-4"
              />
              <button
                class="btn btn--secondary btn--sm mr-2"
                type="button"
                @click="repo.editing = false"
              >
                <i class="ri-check-line mr-2"></i>Done
              </button>
            </div>
          </div>

          <el-dropdown
            trigger="click"
            @command="handleDropdownCommand"
          >
            <span class="el-dropdown-link">
              <i class="ri-xl ri-more-line"></i>
            </span>
            <template #dropdown>
              <el-dropdown-item
                :command="{
                  action: 'rename',
                  repo: repo,
                  index: index
                }"
                ><i
                  class="ri-pencil-line mr-1"
                />Rename</el-dropdown-item
              >
              <el-dropdown-item
                :command="{
                  action: 'delete',
                  repo: repo,
                  index: index
                }"
                ><i
                  class="ri-delete-bin-line mr-1"
                />Delete</el-dropdown-item
              >
            </template>
          </el-dropdown>
        </div>
      </div>
      <div
        class="px-4 py-4 mt-4 bg-gray-50 border border-gray-100 rounded"
      >
        <span class="mb-2 text-sm flex items-center">
          Add repository to benchmark</span
        >
        <el-autocomplete
          v-model="query"
          class="inline-input w-full"
          :fetch-suggestions="handleSearchRepository"
          placeholder="Type to search for repositories in GitHub"
          :trigger-on-focus="false"
          @select="handleAddRepository"
        ></el-autocomplete>
      </div>
      <hr class="my-4" />
      <div class="flex items-center justify-end mt-8">
        <el-button
          class="btn btn--primary mr-2"
          @click="handleSubmit"
        >
          <i class="ri-lg ri-save-line mr-1" />
          <app-i18n code="common.save"></app-i18n>
        </el-button>
        <el-button
          class="btn btn--secondary"
          @click="$emit('close')"
        >
          <i class="ri-lg ri-close-line mr-1" />
          <app-i18n code="common.cancel"></app-i18n>
        </el-button>
      </div>
    </form>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { Octokit } from '@octokit/core'
import { i18n } from '@/i18n'
import ConfirmDialog from '@/shared/confirm-dialog/confirm-dialog.js'

export default {
  name: 'AppGraphBenchmarkSettings',
  props: {
    widget: {
      type: Object,
      default: () => {}
    },
    timeframeOptions: {
      type: Array,
      default: () => []
    }
  },
  emits: ['submit', 'close'],
  data() {
    return {
      oktokit: null,
      repositories: this.widget.settings
        ? JSON.parse(
            JSON.stringify(
              this.widget.settings.repositories
            )
          )
        : [],
      query: '',
      timeframe: this.widget.settings
        ? this.widget.settings.timeframe
        : this.timeframeOptions[
            this.timeframeOptions.length - 1
          ]
    }
  },
  computed: {
    ...mapGetters({
      integrations: 'integration/listByPlatform'
    }),
    githubIntegration() {
      return this.integrations.github
    },
    githubToken() {
      return this.githubIntegration
        ? this.githubIntegration.token
        : null
    }
  },
  created() {
    this.octokit = new Octokit({ auth: this.githubToken })
  },
  methods: {
    ...mapActions({
      updateWidgetSettings: 'widget/updateSettings'
    }),
    async handleSearchRepository(query, callback) {
      const results = await this.octokit.request(
        'GET /search/repositories',
        {
          q: query,
          sort: 'stars',
          order: 'desc',
          perPage: 10
        }
      )
      const mappedResults = results.data.items.map(
        (repo) => {
          return {
            id: repo.id,
            value: repo.name,
            label: repo.name,
            active: false,
            editing: false,
            githubRepo: repo
          }
        }
      )
      callback(mappedResults)
    },
    async handleAddRepository(repository) {
      const index = this.repositories.findIndex(
        (r) => r.id === repository.id
      )
      repository.active = true
      if (index === -1) {
        this.repositories.push(repository)
      } else {
        this.repositories.index = repository
      }
      window.analytics.track('Add Repository Benchmark')
    },
    handleDropdownCommand(command) {
      if (command.action === 'delete') {
        return this.doDestroyWithConfirm(command.index)
      } else if (command.action === 'rename') {
        this.repositories[command.index].editing = true
      }
    },
    async doDestroyWithConfirm(index) {
      try {
        await ConfirmDialog({
          title: i18n('common.confirm'),
          message: i18n('common.areYouSure'),
          confirmButtonText: i18n('common.yes'),
          cancelButtonText: i18n('common.no')
        })

        this.repositories.splice(index, 1)
      } catch (error) {
        // no
      }
    },
    async handleSubmit() {
      this.$emit('submit', {
        repositories: this.repositories,
        timeframe: this.timeframe
      })
    }
  }
}
</script>

<style lang="scss">
.benchmark-settings {
  &-repositories {
    @apply mt-4;

    &-item {
      @apply relative border border-gray-100 rounded px-4 py-2 mt-2 flex justify-between items-center;

      .el-checkbox__label {
        @apply pl-2;
      }

      i {
        @apply cursor-pointer text-gray-600;
        &:hover {
          @apply text-gray-500;
        }
      }

      .el-dropdown {
        @apply mt-4 mr-4;
      }
    }
  }
}
</style>
