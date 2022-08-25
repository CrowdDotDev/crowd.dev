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
        :class="
          active === platform.name
            ? 'activity-platform-tabs-item--active'
            : ''
        "
        @click="handleClick(platform.name)"
      >
        <i
          class="ri-lg flex items-center"
          :class="platform.icon"
        ></i>
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { FilterSchema } from '@/shared/form/filter-schema'
import { ActivityModel } from '@/modules/activity/activity-model'

const { fields } = ActivityModel

const filterSchema = new FilterSchema([fields.platform])

export default {
  name: 'app-activity-platform-tabs',
  data() {
    return {
      platforms: [
        { name: 'slack', icon: 'ri-slack-fill' },
        { name: 'github', icon: 'ri-github-fill' },
        { name: 'twitter', icon: 'ri-twitter-fill' },
        { name: 'discord', icon: 'ri-discord-fill' }
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
  }
}
</style>
