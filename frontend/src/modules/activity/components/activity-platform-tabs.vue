<template>
  <div class="activity-platform-tabs">
    <div class="inline-flex items-center -mx-2">
      <button
        class="activity-platform-tabs-item font-semibold"
        :class="
          active
            ? ''
            : 'activity-platform-tabs-item--active'
        "
        @click="handleClick(null)"
      >
        All Platforms
      </button>
      <button
        v-for="platform in platforms"
        :key="platform.name"
        class="activity-platform-tabs-item"
        @click="handleClick(platform.platform)"
      >
        <img
          :src="platform.icon"
          class="w-5 h-5"
          :class="
            active === platform.platform
              ? ''
              : 'activity-platform-tabs-item--filter-inactive'
          "
          :alt="platform.name"
        />
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { FilterSchema } from '@/shared/form/filter-schema'
import { ActivityModel } from '@/modules/activity/activity-model'
import integrationsJsonArray from '@/jsons/integrations.json'

const { fields } = ActivityModel

const filterSchema = new FilterSchema([fields.platform])

function createFilterEntry(platform) {
  const integration = integrationsJsonArray.find(
    (i) => i.platform === platform
  )
  return {
    platform,
    icon: integration.image,
    name: integration.name
  }
}

export default {
  name: 'AppActivityPlatformTabs',
  data() {
    return {
      platforms: [
        createFilterEntry('slack'),
        createFilterEntry('github'),
        createFilterEntry('twitter'),
        createFilterEntry('discord'),
        createFilterEntry('devto')
      ]
    }
  },
  computed: {
    ...mapGetters({
      filter: 'activity/list/filter'
    }),
    active() {
      return this.filter.platform
    }
  },
  methods: {
    ...mapActions({
      doReset: 'activity/list/doReset',
      doFetch: 'activity/list/doFetch'
    }),
    handleClick(item) {
      this.$emit('change', item)

      if (item) {
        const rawFilter = this.model
        const filter = filterSchema.cast({
          platform: item
        })
        this.doFetch({ rawFilter, filter })
      } else {
        this.doReset()
      }
    }
  }
}
</script>

<style lang="scss">
.activity-platform-tabs {
  @apply bg-white rounded-lg p-2 px-4;
  border: 1px solid #e9e9e9;

  &-item {
    @apply mx-2 text-gray-500;
    transition: 0.2s;

    &:hover:not(&--active) {
      @apply text-gray-800;
    }

    &--active {
      @apply relative text-primary-900;
    }

    &--filter-inactive {
      @apply opacity-40;
      filter: grayscale(100%);

      &:hover {
        @apply opacity-80;
      }
    }
  }
}
</style>
