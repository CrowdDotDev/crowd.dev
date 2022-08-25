<template>
  <div class="benchmark-settings">
    <div
      class="bg-gray-100 border p-4 mb-8 rounded"
      v-if="!githubIntegration"
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
    <form @submit="handleSubmit" v-else>
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
          class="benchmark-settings-repositories-item"
          v-for="(repo, index) in repositories"
          :key="repo.id"
        >
          <div>
            <div
              class="flex items-center"
              v-if="repo.editing !== true"
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

            <div class="flex items-center" v-else>
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
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                icon="ri-pencil-line"
                :command="{
                  action: 'rename',
                  repo: repo,
                  index: index
                }"
                >Rename</el-dropdown-item
              >
              <el-dropdown-item
                icon="ri-delete-bin-line"
                :command="{
                  action: 'delete',
                  repo: repo,
                  index: index
                }"
                >Delete</el-dropdown-item
              >
            </el-dropdown-menu>
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
          class="inline-input w-full"
          :fetch-suggestions="handleSearchRepository"
          v-model="query"
          placeholder="Type to search for repositories in GitHub"
          :trigger-on-focus="false"
          @select="handleAddRepository"
        ></el-autocomplete>
      </div>
      <hr class="my-4" />
      <div class="flex items-center justify-end mt-8">
        <el-button
          @click="handleSubmit"
          icon="ri-lg ri-save-line"
          class="btn btn--primary mr-2"
        >
          <app-i18n code="common.save"></app-i18n>
        </el-button>
        <el-button
          icon="ri-lg ri-close-line"
          class="btn btn--secondary"
          @click="$emit('close')"
        >
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
import Vue from 'vue'

export default {
  name: 'app-graph-benchmark-settings',
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
        Vue.set(this.repositories, index, repository)
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
        await this.$myConfirm(
          i18n('common.areYouSure'),
          i18n('common.confirm'),
          {
            confirmButtonText: i18n('common.yes'),
            cancelButtonText: i18n('common.no'),
            type: 'warning'
          }
        )

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
  },
  created() {
    this.octokit = new Octokit({ auth: this.githubToken })
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
