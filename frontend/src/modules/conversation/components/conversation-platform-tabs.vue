<template>
  <div class="conversation-platform-tabs">
    <div class="inline-flex items-center -mx-2">
      <button
        class="conversation-platform-tabs-item font-semibold"
        :class="
          active
            ? ''
            : 'conversation-platform-tabs-item--active'
        "
        @click="handleClick(null)"
      >
        All Platforms
      </button>
      <button
        v-for="platform in platforms"
        :key="platform.name"
        class="conversation-platform-tabs-item"
        @click="handleClick(platform.platform)"
      >
        <img
          :src="platform.icon"
          class="w-5 h-5"
          :class="
            active === platform.platform
              ? ''
              : 'conversation-platform-tabs-item--filter-inactive'
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
import { ConversationModel } from '@/modules/conversation/conversation-model'
import integrationsJsonArray from '@/jsons/integrations.json'

const { fields } = ConversationModel

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
  name: 'AppConversationStatusTabs',
  data() {
    return {
      platforms: [
        createFilterEntry('slack'),
        createFilterEntry('github'),
        createFilterEntry('discord'),
        // createFilterEntry('twitter'),
        createFilterEntry('devto')
      ]
    }
  },
  computed: {
    ...mapGetters({
      filter: 'conversation/filter'
    }),
    active() {
      return this.filter.platform
    }
  },
  methods: {
    ...mapActions({
      doFetch: 'conversation/doFetch'
    }),
    async handleClick(value) {
      const rawFilter = {
        ...this.filter,
        platform: value
      }
      const filter = filterSchema.cast(rawFilter)
      return this.doFetch({ rawFilter, filter })
    }
  }
}
</script>

<style lang="scss">
.conversation-platform-tabs {
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
