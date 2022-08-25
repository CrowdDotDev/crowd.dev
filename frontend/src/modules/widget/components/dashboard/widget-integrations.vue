<template>
  <app-widget
    :config="config"
    class="custom-height"
    v-if="widget"
  >
    <div class="widget-integrations">
      <div
        v-if="activeIntegrationsByStatus['in-progress']"
        class="mb-8"
      >
        <span class="block text-xs text-gray-500 uppercase">
          In Progress ({{
            activeIntegrationsByStatus['in-progress']
              .length
          }})
        </span>
        <div class="flex flex-wrap items-center relative">
          <div
            v-for="(integration,
            index) in activeIntegrationsByStatus[
              'in-progress'
            ]"
            :key="index"
          >
            <div class="my-2">
              <el-tooltip
                :content="integration.name"
                placement="top"
              >
                <img
                  :src="integration.image"
                  class="h-8 mr-4"
                />
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="activeIntegrationsByStatus['done']"
        class="mb-8"
      >
        <span class="block text-xs text-gray-500 uppercase">
          Active ({{
            activeIntegrationsByStatus['done'].length
          }})
        </span>
        <div class="flex flex-wrap items-center relative">
          <div
            v-for="(integration,
            index) in activeIntegrationsByStatus.done"
            :key="index"
          >
            <div class="my-2">
              <el-tooltip
                :content="integration.name"
                placement="top"
              >
                <img
                  :src="integration.image"
                  class="h-8 mr-4"
                />
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
      <div v-if="inactiveIntegrations.length > 0">
        <span class="block text-xs text-gray-500 uppercase">
          Inactive ({{ inactiveIntegrations.length }})
        </span>
        <div class="flex flex-wrap items-center relative">
          <div
            v-for="(integration,
            index) in inactiveIntegrations"
            :key="index"
          >
            <div class="my-2">
              <el-tooltip
                :content="integration.name"
                placement="top"
              >
                <img
                  :src="integration.image"
                  class="h-8 mr-4 filter saturate-0 hover:saturate-100 mb-0"
                />
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  </app-widget>
</template>

<script>
import Widget from '../widget'
import { mapGetters, mapActions } from 'vuex'
import integrationsJson from '@/jsons/integrations'

export default {
  name: 'widget-integrations',
  components: {
    'app-widget': Widget
  },
  computed: {
    ...mapGetters({
      widgetFindByType: 'widget/findByType',
      integrations: 'integration/listByPlatform',
      integrationsArray: 'integration/array',
      integrationsCount: 'integration/count'
    }),
    widget() {
      return this.widgetFindByType('integrations')
    },
    config() {
      return {
        id: this.widget ? this.widget.id : null,
        type: this.widget.type,
        title: 'Integrations',
        loading: this.loading,
        link: {
          name: 'settings',
          query: { activeTab: 'integrations' }
        },
        linkLabel: 'View all'
      }
    },
    inactiveIntegrations() {
      return integrationsJson.filter((i) => {
        return (
          this.integrations[i.platform] === undefined &&
          i.platform !== 'other'
        )
      })
    },
    activeIntegrationsByStatus() {
      return this.integrationsArray.reduce((acc, item) => {
        if (!(item.status in acc)) {
          acc[item.status] = [item]
        } else {
          acc[item.status].push(item)
        }
        return acc
      }, {})
    }
  },
  data() {
    return {
      loading: false
    }
  },
  async created() {
    if (this.integrationsCount === 0) {
      await this.doFetch()
    }
  },
  methods: {
    ...mapActions({
      doFetch: 'integration/doFetch'
    })
  }
}
</script>

<style lang="scss">
.custom-height {
  height: 372px;

  .pt-4 {
    @apply overflow-auto flex flex-col h-full;
  }
}
</style>
